/**
 * Loopback OpenAI-compatible gateway for the keyless free-model adapter.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { FreeModelAdapter, FreeModelRuntime } from './free-model.ts'

const REQUEST_BODY_LIMIT = 8 * 1024 * 1024

export interface FreeGatewayHandle {
  dispose: () => Promise<void>
  port: () => number | undefined
}

/** Register a loopback-only OpenAI-compatible listener. */
export function registerFreeGateway(
  ctx: Record<string, any>,
  adapter: FreeModelAdapter,
  runtime: FreeModelRuntime,
  config: Record<string, any>,
): FreeGatewayHandle {
  let server: Server | undefined
  let settled = false
  server = createServer((req, res) => {
    void handleRequest(ctx, adapter, runtime, config, req, res).catch(error => {
      if (!res.headersSent) res.writeHead(error?.status && error.status >= 400 ? error.status : 500, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: { message: String(error?.message ?? error), type: 'gateway_error' } }))
    })
  })
  server.once('close', () => { settled = true })
  const port = Number(config.port ?? 4180)
  const listening = new Promise<void>((resolve, reject) => {
    server!.once('error', reject)
    server!.listen(Number.isInteger(port) && port >= 0 ? port : 4180, '127.0.0.1', () => {
      server!.removeListener('error', reject)
      resolve()
    })
  })
  void listening.then(() => {
    const actual = (server?.address() as AddressInfo | undefined)?.port
    ctx.logger?.info?.(`dsh-model-palette: free-model OpenAI gateway listening on http://127.0.0.1:${String(actual)}/v1`)
  }, error => {
    ctx.logger?.warn?.(`dsh-model-palette: free-model gateway failed to start: ${String(error?.message ?? error)}`)
  })
  return {
    dispose: async () => {
      if (server === undefined || settled) return
      await new Promise<void>((resolve, reject) => server!.close(error => error === undefined ? resolve() : reject(error)))
    },
    port: () => (server?.address() as AddressInfo | undefined)?.port,
  }
}

async function handleRequest(ctx: Record<string, any>, adapter: FreeModelAdapter, runtime: FreeModelRuntime, config: Record<string, any>, req: IncomingMessage, res: ServerResponse) {
  if (!isLoopbackRequest(req)) throw Object.assign(new Error('the free-model gateway listens on loopback only'), { status: 403 })
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders())
    res.end()
    return
  }
  const url = new URL(req.url ?? '/', 'http://127.0.0.1')
  if (req.method === 'GET' && (url.pathname === '/v1/models' || url.pathname === '/models')) {
    await authorize(ctx, config, req)
    const models = runtime.snapshot().models
    res.writeHead(200, jsonHeaders())
    res.end(JSON.stringify({ object: 'list', data: models.map(model => ({ id: model.id, object: 'model', owned_by: model.channel, context_window: model.contextWindow, max_output_tokens: model.maxOutput })) }))
    return
  }
  if (req.method !== 'POST' || !/\/v1\/chat\/completions$/u.test(url.pathname)) throw Object.assign(new Error('unknown OpenAI-compatible route'), { status: 404 })
  await authorize(ctx, config, req)
  const body = await readJson(req)
  const modelId = requireString(body.model, 'model')
  if (runtime.entry(modelId) === undefined) throw Object.assign(new Error(`model '${modelId}' is unavailable`), { status: 404 })
  const options = openAiToDshOptions(body, modelId, req)
  const stream = body.stream !== false
  res.writeHead(200, {
    ...stream ? sseHeaders() : jsonHeaders(),
    ...corsHeaders(),
  })
  if (!stream) {
    const outcome = { text: '', reasoning: '', toolCalls: [] as Record<string, unknown>[], usage: undefined as Record<string, number> | undefined, finish: 'stop' }
    try {
      for await (const chunk of adapter.stream(options)) updateOutcome(outcome, chunk)
    } catch (error) {
      runtime.markFailure(modelId, error)
      throw error
    }
    res.end(JSON.stringify({
      id: `chatcmpl-free-${crypto.randomUUID()}`, object: 'chat.completion', created: Math.floor(Date.now() / 1000), model: modelId,
      choices: [{ index: 0, message: { role: 'assistant', content: outcome.text, ...(outcome.reasoning === '' ? {} : { reasoning_content: outcome.reasoning }), ...(outcome.toolCalls.length === 0 ? {} : { tool_calls: outcome.toolCalls }) }, finish_reason: outcome.finish }],
      ...(outcome.usage === undefined ? {} : { usage: outcome.usage }),
    }))
    return
  }
  const id = `chatcmpl-free-${crypto.randomUUID()}`
  try {
    let sentFinish = false
    for await (const chunk of adapter.stream(options)) {
      const rows = chunkToOpenAi(id, modelId, chunk)
      sentFinish ||= chunk.type === 'finish'
      for (const row of rows) res.write(`data: ${JSON.stringify(row)}\n\n`)
    }
    if (!sentFinish) res.write(`data: ${JSON.stringify({ id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: modelId, choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\n`)
  } catch (error) {
    runtime.markFailure(modelId, error)
    res.write(`data: ${JSON.stringify({ error: { message: String((error as Error)?.message ?? error), type: 'upstream_error' } })}\n\n`)
  }
  res.end('data: [DONE]\n\n')
}

function openAiToDshOptions(body: Record<string, any>, model: string, req: IncomingMessage) {
  const system: string[] = []
  const messages: Record<string, unknown>[] = []
  for (const row of Array.isArray(body.messages) ? body.messages : []) {
    if (!isRecord(row)) continue
    const content = openAiContent(row.content)
    if (row.role === 'system' || row.role === 'developer') { if (content !== '') system.push(content); continue }
    if (row.role === 'tool') {
      messages.push({ role: 'user', content: [{ type: 'tool-result', toolCallId: String(row.tool_call_id ?? ''), content: [{ type: 'text', text: content }] }], source: { kind: 'tool', callId: String(row.tool_call_id ?? '') } })
      continue
    }
    const assistant = row.role === 'assistant'
    const blocks: Record<string, unknown>[] = content === '' ? [] : [{ type: 'text', text: content }]
    if (assistant && Array.isArray(row.tool_calls)) {
      for (const call of row.tool_calls) {
        if (!isRecord(call) || !isRecord(call.function)) continue
        blocks.push({ type: 'tool-call', id: String(call.id ?? ''), name: String(call.function.name ?? ''), arguments: String(call.function.arguments ?? '{}') })
      }
    }
    if (blocks.length === 0) continue
    messages.push({ role: assistant ? 'assistant' : 'user', content: blocks, ...(assistant ? { source: { kind: 'model', provider: 'dsh-free-models', model } } : {}) })
  }
  const tools = Array.isArray(body.tools) ? body.tools.filter(isRecord).map(tool => ({
    name: requireString(isRecord(tool.function) ? tool.function.name : tool.name, 'tools[].function.name'),
    description: String((isRecord(tool.function) ? tool.function.description : tool.description) ?? ''),
    parameters: isRecord(isRecord(tool.function) ? tool.function.parameters : tool.parameters) ? (isRecord(tool.function) ? tool.function.parameters : tool.parameters) : { type: 'object', properties: {} },
  })) : []
  return {
    provider: 'dsh-free-models', model, messages,
    ...(system.length === 0 ? {} : { system: system.join('\n\n') }),
    ...(tools.length === 0 ? {} : { tools }),
    ...(body.temperature === undefined ? {} : { temperature: body.temperature }),
    ...(body.max_tokens === undefined ? {} : { maxTokens: body.max_tokens }),
    ...(body.reasoning_effort === undefined ? {} : { reasoningEffort: body.reasoning_effort }),
    signal: AbortSignal.timeout(300_000),
    sessionId: `gateway:${String(body.user ?? req.headers['x-request-id'] ?? 'shared')}`,
  }
}

function updateOutcome(outcome: Record<string, any>, chunk: Record<string, any>) {
  if (chunk.type === 'text-delta') outcome.text += chunk.text
  else if (chunk.type === 'reasoning-delta') outcome.reasoning += chunk.text
  else if (chunk.type === 'tool-call-delta') {
    let call = outcome.toolCalls.find((row: Record<string, unknown>) => row.index === chunk.index)
    if (call === undefined) { call = { index: chunk.index, id: chunk.id, type: 'function', function: { name: chunk.name ?? '', arguments: '' } }; outcome.toolCalls.push(call) }
    if (typeof chunk.name === 'string') call.function.name = chunk.name
    call.function.arguments += chunk.argumentsDelta
  } else if (chunk.type === 'usage') outcome.usage = chunk.usage
  else if (chunk.type === 'finish') outcome.finish = chunk.reason.kind === 'tool-calls' ? 'tool_calls' : chunk.reason.kind === 'max-tokens' ? 'length' : 'stop'
}

function chunkToOpenAi(id: string, model: string, chunk: Record<string, any>): Record<string, unknown>[] {
  if (chunk.type === 'text-delta' || chunk.type === 'reasoning-delta') {
    const delta = chunk.type === 'text-delta' ? { content: chunk.text } : { reasoning_content: chunk.text }
    return [{ id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model, choices: [{ index: 0, delta, finish_reason: null }] }]
  }
  if (chunk.type === 'tool-call-delta') {
    return [{ id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model, choices: [{ index: 0, delta: { tool_calls: [{ index: chunk.index, id: chunk.id, type: 'function', function: { name: chunk.name ?? '', arguments: chunk.argumentsDelta } }] }, finish_reason: null }] }]
  }
  if (chunk.type === 'usage') return [{ id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model, choices: [{ index: 0, delta: {}, finish_reason: null }], usage: chunk.usage }]
  if (chunk.type === 'finish') {
    const finish = chunk.reason.kind === 'tool-calls' ? 'tool_calls' : chunk.reason.kind === 'max-tokens' ? 'length' : 'stop'
    return [{ id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model, choices: [{ index: 0, delta: {}, finish_reason: finish }] }]
  }
  return []
}

async function authorize(ctx: Record<string, any>, config: Record<string, any>, req: IncomingMessage) {
  const ref = typeof config.credentialRef === 'string' ? config.credentialRef.trim() : ''
  if (ref === '') return
  const resolved = await ctx.credentials.resolve(ref)
  if (resolved?.value === undefined) throw Object.assign(new Error(`credential ${ref} is not configured`), { status: 503 })
  const header = String(req.headers.authorization ?? '')
  if (header !== `Bearer ${resolved.value}`) throw Object.assign(new Error('invalid gateway bearer token'), { status: 401 })
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.byteLength
    if (size > REQUEST_BODY_LIMIT) throw Object.assign(new Error('request body exceeds 8 MiB'), { status: 413 })
    chunks.push(buffer)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw Object.assign(new Error('request body must be JSON'), { status: 400 }) }
}

function openAiContent(value: unknown) {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  return value.map(part => {
    if (typeof part === 'string') return part
    if (!isRecord(part)) return ''
    const text = part.text ?? part.input_text ?? part.output_text
    return typeof text === 'string' ? text : ''
  }).filter(text => text !== '').join('\n')
}

function isLoopbackRequest(req: IncomingMessage) {
  const remote = String(req.socket.remoteAddress ?? '').replace(/^::ffff:/iu, '').toLocaleLowerCase()
  if (remote !== '127.0.0.1' && remote !== '::1') return false
  try { return new URL(req.url ?? '/', `http://${String(req.headers.host ?? '127.0.0.1')}`).hostname === '127.0.0.1' } catch { return false }
}
function jsonHeaders() { return { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } }
function sseHeaders() { return { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', connection: 'keep-alive' } }
function corsHeaders() { return { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' } }
function requireString(value: unknown, field: string) { if (typeof value !== 'string' || value.trim() === '') throw Object.assign(new Error(`${field} is required`), { status: 400 }); return value.trim() }
function isRecord(value: unknown): value is Record<string, any> { return typeof value === 'object' && value !== null && !Array.isArray(value) }

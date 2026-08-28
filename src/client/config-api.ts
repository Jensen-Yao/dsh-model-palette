interface ConfigApiSuccess<T> {
  ok: true
  value: T
}

interface ConfigApiFailure {
  ok: false
  error?: { message?: string }
}

const CONFIG_API_BASE = '/model-palette/api/config'

export type ProtocolProbeResult = {
  protocol: 'openai-completions' | 'openai-responses'
  available: boolean
  error?: string
}

export type ApiKeyValidationResult = {
  protocol: 'openai-completions' | 'openai-responses' | 'anthropic-messages'
  model: string
  status: 'valid' | 'invalid' | 'blocked' | 'unavailable' | 'unknown'
  checkedBy: 'request'
  httpStatus?: number
  message: string
  credentialTarget: 'runtime' | 'draft'
  runtimeConfigured: boolean
  credentialSource?: string
  runtimeMatchesDraft?: boolean
  draft?: {
    status: ApiKeyValidationResult['status']
    httpStatus?: number
    message: string
  }
}

export type BatchApiKeyValidationResult = {
  provider: string
  displayName: string
  baseURL: string
  credentialRef: string
  protocol: ApiKeyValidationResult['protocol']
  model: string
  status: ApiKeyValidationResult['status'] | 'missing'
  checkedBy: 'request'
  httpStatus?: number
  message: string
  credentialSource?: string
}

/** Reveal one stored credential through the plugin's direct-loopback-only route. */
export async function revealCredential(ref: string): Promise<string> {
  const response = await fetch(`${CONFIG_API_BASE}/credentials/reveal`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ref }),
  })
  let payload: ConfigApiSuccess<{ value: string }> | ConfigApiFailure
  try {
    payload = await response.json() as ConfigApiSuccess<{ value: string }> | ConfigApiFailure
  } catch {
    throw new Error(`Configuration API returned HTTP ${response.status}`)
  }
  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok
      ? `Configuration API returned HTTP ${response.status}`
      : payload.error?.message ?? `Configuration API returned HTTP ${response.status}`)
  }
  return payload.value.value
}

/** Test both OpenAI request protocols against one model through the plugin backend. */
export async function probeProviderProtocols(input: {
  baseURL: string
  credentialRef: string
  model: string
  apiKey?: string
}): Promise<ProtocolProbeResult[]> {
  const response = await fetch(`${CONFIG_API_BASE}/protocols/probe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  let payload: ConfigApiSuccess<{ results: ProtocolProbeResult[] }> | ConfigApiFailure
  try {
    payload = await response.json() as ConfigApiSuccess<{ results: ProtocolProbeResult[] }> | ConfigApiFailure
  } catch {
    throw new Error(`Configuration API returned HTTP ${response.status}`)
  }
  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? `Configuration API returned HTTP ${response.status}` : payload.error?.message ?? `Configuration API returned HTTP ${response.status}`)
  }
  return payload.value.results
}

/** Validate one provider credential without returning the credential to the browser. */
export async function validateProviderApiKey(input: {
  baseURL: string
  credentialRef: string
  protocol: ApiKeyValidationResult['protocol']
  model?: string
  apiKey?: string
}): Promise<ApiKeyValidationResult> {
  const response = await fetch(`${CONFIG_API_BASE}/credentials/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  let payload: ConfigApiSuccess<ApiKeyValidationResult> | ConfigApiFailure
  try {
    payload = await response.json() as ConfigApiSuccess<ApiKeyValidationResult> | ConfigApiFailure
  } catch {
    throw new Error(`Configuration API returned HTTP ${response.status}`)
  }
  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? `Configuration API returned HTTP ${response.status}` : payload.error?.message ?? `Configuration API returned HTTP ${response.status}`)
  }
  return payload.value
}

/** Validate all configured runtime credentials without returning any credential to the browser. */
export async function validateProviderApiKeys(input: {
  providers: Array<Pick<BatchApiKeyValidationResult, 'provider' | 'displayName' | 'baseURL' | 'credentialRef' | 'protocol' | 'model'>>
}): Promise<BatchApiKeyValidationResult[]> {
  const response = await fetch(`${CONFIG_API_BASE}/credentials/validate-batch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  let payload: ConfigApiSuccess<{ results: BatchApiKeyValidationResult[] }> | ConfigApiFailure
  try {
    payload = await response.json() as ConfigApiSuccess<{ results: BatchApiKeyValidationResult[] }> | ConfigApiFailure
  } catch {
    throw new Error(`Configuration API returned HTTP ${response.status}`)
  }
  if (!response.ok || !payload.ok) {
    throw new Error(payload.ok ? `Configuration API returned HTTP ${response.status}` : payload.error?.message ?? `Configuration API returned HTTP ${response.status}`)
  }
  return payload.value.results
}

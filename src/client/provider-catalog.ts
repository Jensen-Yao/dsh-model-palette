/**
 * Provider catalog: the template list behind the visual "add provider" grid and
 * the icon/name matcher for already-configured provider cards.
 *
 * `catalog: true` templates map 1:1 to the pi-ai provider directory shipped
 * with DSH: adding such a route only names a display name and credential
 * reference — the endpoint, protocol, and model list come from the installed
 * DSH catalog until the user overrides them.
 */

export type ProviderCategory = 'custom' | 'subscription' | 'api-key'

export interface ProviderTemplate {
  /** DSH provider route id suggested for the new provider. */
  id: string
  displayName: string
  category: ProviderCategory
  /** Icon key understood by ProviderIcon. */
  icon: string
  baseURL?: string
  api?: 'openai-completions' | 'openai-responses' | 'anthropic-messages'
  credentialRef?: string
  /** Approximate model count in the DSH built-in catalog, when known. */
  models?: number
  /** Short endpoint hint rendered under the name. */
  hint?: string
  /** Route reuses the DSH built-in catalog: no baseURL/protocol/models needed. */
  catalog?: boolean
  /** Templates the plugin cannot fully create (OAuth); clicking explains why. */
  oauthOnly?: boolean
}

export const CUSTOM_TEMPLATES: ProviderTemplate[] = [
  { id: 'openai-compatible', displayName: 'OpenAI Compatible', category: 'custom', icon: 'completions', baseURL: 'https://api.example.com/v1', api: 'openai-completions', hint: '/v1/chat/completions · openai-completions' },
  { id: 'anthropic-compatible', displayName: 'Anthropic Compatible', category: 'custom', icon: 'anthropiccompat', baseURL: 'https://api.example.com/v1', api: 'anthropic-messages', hint: '/v1/messages · anthropic-messages' },
  { id: 'openai-responses', displayName: 'OpenAI Responses', category: 'custom', icon: 'responses', baseURL: 'https://api.example.com/v1', api: 'openai-responses', hint: 'Responses API · openai-responses' },
  { id: 'openrouter-free', displayName: 'OpenRouter Free（仅免费）', category: 'custom', icon: 'openrouter', baseURL: 'https://openrouter.ai/api/v1', api: 'openai-completions', credentialRef: 'OPENROUTER_API_KEY', hint: '启动时自动同步 :free 模型' },
]

export const SUBSCRIPTION_TEMPLATES: ProviderTemplate[] = [
  { id: 'github-copilot', displayName: 'GitHub Copilot', category: 'subscription', icon: 'copilot', oauthOnly: true },
  { id: 'kimi-for-coding', displayName: 'Kimi For Coding', category: 'subscription', icon: 'kimi', oauthOnly: true },
  { id: 'chatgpt-plus-pro', displayName: 'ChatGPT Plus/Pro', category: 'subscription', icon: 'openai', oauthOnly: true },
  { id: 'openrouter-oauth', displayName: 'OpenRouter', category: 'subscription', icon: 'openrouter', oauthOnly: true },
  { id: 'radius-oauth', displayName: 'Radius', category: 'subscription', icon: 'radius', oauthOnly: true },
  { id: 'xai-oauth', displayName: 'xAI', category: 'subscription', icon: 'xai', oauthOnly: true },
]

/** The full DSH built-in provider directory; each adds a catalog-backed route. */
export const CATALOG_TEMPLATES: ProviderTemplate[] = [
  { id: 'openai', displayName: 'OpenAI', category: 'api-key', icon: 'openai', credentialRef: 'OPENAI_API_KEY', models: 39, hint: '内置目录 · 39 个模型', catalog: true },
  { id: 'anthropic', displayName: 'Anthropic', category: 'api-key', icon: 'anthropic', credentialRef: 'ANTHROPIC_API_KEY', models: 11, hint: '内置目录 · 11 个模型', catalog: true },
  { id: 'deepseek', displayName: 'DeepSeek', category: 'api-key', icon: 'deepseek', credentialRef: 'DEEPSEEK_API_KEY', models: 6, hint: '内置目录 · 6 个模型', catalog: true },
  { id: 'openrouter', displayName: 'OpenRouter', category: 'api-key', icon: 'openrouter', credentialRef: 'OPENROUTER_API_KEY', models: 362, hint: '内置目录 · 362 个模型', catalog: true },
  { id: 'google', displayName: 'Google', category: 'api-key', icon: 'google', credentialRef: 'GEMINI_API_KEY', models: 22, hint: '内置目录 · 22 个模型', catalog: true },
  { id: 'google-vertex', displayName: 'Google Vertex AI', category: 'api-key', icon: 'google', models: 9, hint: '内置目录 · 需配置项目与凭据', catalog: true },
  { id: 'amazon-bedrock', displayName: 'Amazon Bedrock', category: 'api-key', icon: 'bedrock', models: 121, hint: '内置目录 · 需 AWS 凭据', catalog: true },
  { id: 'azure-openai-responses', displayName: 'Azure OpenAI', category: 'api-key', icon: 'azure', credentialRef: 'AZURE_OPENAI_API_KEY', models: 38, hint: '内置目录 · 38 个模型', catalog: true },
  { id: 'moonshotai', displayName: 'Moonshot AI', category: 'api-key', icon: 'moonshot', credentialRef: 'MOONSHOT_API_KEY', models: 10, hint: '内置目录 · 10 个模型', catalog: true },
  { id: 'moonshotai-cn', displayName: 'Moonshot AI CN', category: 'api-key', icon: 'moonshot', credentialRef: 'MOONSHOT_CN_API_KEY', models: 10, hint: '内置目录 · 中国站', catalog: true },
  { id: 'kimi-for-coding-api', displayName: 'Kimi For Coding', category: 'api-key', icon: 'kimi', credentialRef: 'KIMI_API_KEY', models: 4, hint: '内置目录 · anthropic-messages', catalog: true },
  { id: 'minimax', displayName: 'MiniMax', category: 'api-key', icon: 'minimax', credentialRef: 'MINIMAX_API_KEY', models: 3, hint: '内置目录 · 国际站', catalog: true },
  { id: 'minimax-cn', displayName: 'MiniMax CN', category: 'api-key', icon: 'minimax', credentialRef: 'MINIMAX_CN_API_KEY', models: 3, hint: '内置目录 · 中国站', catalog: true },
  { id: 'zai', displayName: 'Z.AI', category: 'api-key', icon: 'zai', credentialRef: 'ZAI_API_KEY', models: 7, hint: '内置目录 · GLM 系列', catalog: true },
  { id: 'zai-coding-cn', displayName: 'Z.AI Coding CN', category: 'api-key', icon: 'zai', credentialRef: 'ZAI_CODING_CN_API_KEY', models: 10, hint: '内置目录 · bigmodel.cn', catalog: true },
  { id: 'qwen-token-plan', displayName: 'Qwen Token Plan', category: 'api-key', icon: 'qwen', credentialRef: 'QWEN_TOKEN_PLAN_API_KEY', models: 18, hint: '内置目录 · 国际站', catalog: true },
  { id: 'qwen-token-plan-cn', displayName: 'Qwen Token Plan CN', category: 'api-key', icon: 'qwen', credentialRef: 'QWEN_TOKEN_PLAN_CN_API_KEY', models: 18, hint: '内置目录 · 中国站', catalog: true },
  { id: 'qwen-token-plan-individual', displayName: 'Qwen Token Plan Individual', category: 'api-key', icon: 'qwen', credentialRef: 'QWEN_TOKEN_PLAN_API_KEY', models: 9, hint: '内置目录 · 个人版', catalog: true },
  { id: 'xiaomi', displayName: 'Xiaomi', category: 'api-key', icon: 'xiaomi', credentialRef: 'XIAOMI_API_KEY', models: 3, hint: '内置目录 · MiMo 系列', catalog: true },
  { id: 'xiaomi-token-plan-ams', displayName: 'Xiaomi Token Plan AMS', category: 'api-key', icon: 'xiaomi', credentialRef: 'XIAOMI_TOKEN_PLAN_AMS_API_KEY', models: 2, hint: '内置目录 · 阿姆斯特丹', catalog: true },
  { id: 'xiaomi-token-plan-cn', displayName: 'Xiaomi Token Plan CN', category: 'api-key', icon: 'xiaomi', credentialRef: 'XIAOMI_TOKEN_PLAN_CN_API_KEY', models: 2, hint: '内置目录 · 中国站', catalog: true },
  { id: 'xiaomi-token-plan-sgp', displayName: 'Xiaomi Token Plan SGP', category: 'api-key', icon: 'xiaomi', credentialRef: 'XIAOMI_TOKEN_PLAN_SGP_API_KEY', models: 2, hint: '内置目录 · 新加坡', catalog: true },
  { id: 'xai', displayName: 'xAI', category: 'api-key', icon: 'xai', credentialRef: 'XAI_API_KEY', models: 3, hint: '内置目录 · Grok 系列', catalog: true },
  { id: 'mistral', displayName: 'Mistral', category: 'api-key', icon: 'mistral', credentialRef: 'MISTRAL_API_KEY', models: 32, hint: '内置目录 · 32 个模型', catalog: true },
  { id: 'nvidia', displayName: 'NVIDIA', category: 'api-key', icon: 'nvidia', credentialRef: 'NVIDIA_API_KEY', models: 20, hint: '内置目录 · NIM 目录', catalog: true },
  { id: 'together', displayName: 'Together', category: 'api-key', icon: 'together', credentialRef: 'TOGETHER_API_KEY', models: 21, hint: '内置目录 · 21 个模型', catalog: true },
  { id: 'fireworks', displayName: 'Fireworks', category: 'api-key', icon: 'fireworks', credentialRef: 'FIREWORKS_API_KEY', models: 19, hint: '内置目录 · 19 个模型', catalog: true },
  { id: 'groq', displayName: 'Groq', category: 'api-key', icon: 'groq', credentialRef: 'GROQ_API_KEY', models: 9, hint: '内置目录 · 9 个模型', catalog: true },
  { id: 'baseten', displayName: 'Baseten', category: 'api-key', icon: 'baseten', credentialRef: 'BASETEN_API_KEY', models: 20, hint: '内置目录 · 20 个模型', catalog: true },
  { id: 'cerebras', displayName: 'Cerebras', category: 'api-key', icon: 'cerebras', credentialRef: 'CEREBRAS_API_KEY', models: 2, hint: '内置目录 · 2 个模型', catalog: true },
  { id: 'huggingface', displayName: 'Hugging Face', category: 'api-key', icon: 'huggingface', credentialRef: 'HF_TOKEN', models: 71, hint: '内置目录 · Inference Providers', catalog: true },
  { id: 'ant-ling', displayName: 'Ant Ling', category: 'api-key', icon: 'antling', credentialRef: 'ANT_LING_API_KEY', models: 3, hint: '内置目录 · 3 个模型', catalog: true },
  { id: 'opencode', displayName: 'OpenCode Zen', category: 'api-key', icon: 'opencode', credentialRef: 'OPENCODE_API_KEY', models: 63, hint: '内置目录 · 63 个模型', catalog: true },
  { id: 'opencode-go', displayName: 'OpenCode Go', category: 'api-key', icon: 'opencode', credentialRef: 'OPENCODE_API_KEY', models: 27, hint: '内置目录 · 27 个模型', catalog: true },
  { id: 'vercel-ai-gateway', displayName: 'Vercel AI Gateway', category: 'api-key', icon: 'vercel', credentialRef: 'AI_GATEWAY_API_KEY', models: 233, hint: '内置目录 · 233 个模型', catalog: true },
  { id: 'cloudflare-ai-gateway', displayName: 'Cloudflare AI Gateway', category: 'api-key', icon: 'cloudflare', models: 50, hint: '内置目录 · 需账号与网关 ID', catalog: true },
  { id: 'cloudflare-workers-ai', displayName: 'Cloudflare Workers AI', category: 'api-key', icon: 'cloudflare', models: 18, hint: '内置目录 · 18 个模型', catalog: true },
  { id: 'radius', displayName: 'Radius', category: 'api-key', icon: 'radius', models: 0, hint: '内置目录 · 0 个模型', catalog: true },
  { id: 'github-copilot-api', displayName: 'GitHub Copilot', category: 'api-key', icon: 'copilot', credentialRef: 'COPILOT_GITHUB_TOKEN', models: 60, hint: '内置目录 · 支持令牌接入', catalog: true },
]

export const ALL_TEMPLATES: readonly ProviderTemplate[] = [
  ...CUSTOM_TEMPLATES,
  ...SUBSCRIPTION_TEMPLATES,
  ...CATALOG_TEMPLATES,
]

export function templatesByCategory(): { custom: ProviderTemplate[]; subscription: ProviderTemplate[]; catalog: ProviderTemplate[] } {
  return {
    custom: CUSTOM_TEMPLATES,
    subscription: SUBSCRIPTION_TEMPLATES,
    catalog: CATALOG_TEMPLATES,
  }
}

/** Fuzzy filter across display name, id, hint, and endpoint. */
export function filterTemplates(templates: readonly ProviderTemplate[], query: string): ProviderTemplate[] {
  const needle = query.trim().toLocaleLowerCase()
  if (needle === '') return [...templates]
  return templates.filter(template =>
    `${template.displayName} ${template.id} ${template.hint ?? ''} ${template.baseURL ?? ''}`.toLocaleLowerCase().includes(needle),
  )
}

export interface ProviderVisual {
  icon: string
  /** Display name suggestion; undefined keeps the configured name. */
  brandName?: string
}

interface BrandRule {
  icon: string
  brandName: string
  /** Matched against provider id first, then baseURL host. */
  patterns: RegExp[]
}

const BRAND_RULES: BrandRule[] = [
  { icon: 'openrouter', brandName: 'OpenRouter', patterns: [/openrouter/iu] },
  { icon: 'deepseek', brandName: 'DeepSeek', patterns: [/deepseek/iu] },
  { icon: 'anthropic', brandName: 'Anthropic', patterns: [/anthropic|claude/iu] },
  { icon: 'openai', brandName: 'OpenAI', patterns: [/openai|chatgpt|gpt-|^o[134](-|$)/iu] },
  { icon: 'google', brandName: 'Google', patterns: [/google|gemini|generativelanguage|vertex/iu] },
  { icon: 'moonshot', brandName: 'Moonshot AI', patterns: [/moonshot|kimi/iu] },
  { icon: 'minimax', brandName: 'MiniMax', patterns: [/minimax/iu] },
  { icon: 'zai', brandName: 'Z.AI', patterns: [/z-?ai|bigmodel|glm|zhipu/iu] },
  { icon: 'qwen', brandName: 'Qwen', patterns: [/qwen|alibaba|aliyun|dashscope|token-plan/iu] },
  { icon: 'xai', brandName: 'xAI', patterns: [/^x-?ai$|grok|x\.ai/iu] },
  { icon: 'xiaomi', brandName: 'Xiaomi', patterns: [/xiaomi|mimo/iu] },
  { icon: 'mistral', brandName: 'Mistral', patterns: [/mistral/iu] },
  { icon: 'nvidia', brandName: 'NVIDIA', patterns: [/nvidia|nemotron/iu] },
  { icon: 'together', brandName: 'Together', patterns: [/together/iu] },
  { icon: 'fireworks', brandName: 'Fireworks', patterns: [/fireworks/iu] },
  { icon: 'groq', brandName: 'Groq', patterns: [/groq/iu] },
  { icon: 'azure', brandName: 'Azure OpenAI', patterns: [/azure/iu] },
  { icon: 'bedrock', brandName: 'Amazon Bedrock', patterns: [/bedrock|amazon/iu] },
  { icon: 'cloudflare', brandName: 'Cloudflare', patterns: [/cloudflare/iu] },
  { icon: 'vercel', brandName: 'Vercel', patterns: [/vercel/iu] },
  { icon: 'baseten', brandName: 'Baseten', patterns: [/baseten/iu] },
  { icon: 'cerebras', brandName: 'Cerebras', patterns: [/cerebras/iu] },
  { icon: 'huggingface', brandName: 'Hugging Face', patterns: [/huggingface|hf[-_]/iu] },
  { icon: 'copilot', brandName: 'GitHub Copilot', patterns: [/copilot/iu] },
  { icon: 'opencode', brandName: 'OpenCode', patterns: [/opencode/iu] },
  { icon: 'antling', brandName: 'Ant Ling', patterns: [/ant-?ling/iu] },
  { icon: 'kimi', brandName: 'Kimi', patterns: [/kimi/iu] },
  { icon: 'stepfun', brandName: 'StepFun', patterns: [/stepfun|step-/iu] },
  { icon: 'tencent', brandName: 'Tencent', patterns: [/tencent|hy[34]/iu] },
  { icon: 'sensenova', brandName: 'SenseNova', patterns: [/sensenova|sensecore/iu] },
  { icon: 'scnet', brandName: '国家超算', patterns: [/scnet|超算/iu] },
  { icon: 'generic', brandName: '', patterns: [] },
]

/** Resolve the icon (and optional brand name) for a configured provider. */
export function providerMeta(providerId: string, profile?: { readonly baseURL?: unknown }): ProviderVisual {
  const id = providerId.toLocaleLowerCase()
  const host = hostOf(profile?.baseURL)
  for (const rule of BRAND_RULES) {
    if (rule.patterns.length === 0) continue
    if (rule.patterns.some(pattern => pattern.test(id) || (host !== '' && pattern.test(host)))) {
      return { icon: rule.icon, brandName: rule.brandName === '' ? undefined : rule.brandName }
    }
  }
  return { icon: 'generic' }
}

function hostOf(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return ''
  try {
    return new URL(value).hostname
  } catch {
    return value.toLocaleLowerCase()
  }
}

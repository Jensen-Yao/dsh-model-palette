/**
 * Provider catalog: the template list behind the visual "add provider" grid and
 * the icon/name matcher for already-configured provider cards. Template facts
 * mirror the pi-ai built-in provider directory shipped with DSH 0.1.6.
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
  /** Templates the plugin cannot fully create (OAuth); clicking explains why. */
  oauthOnly?: boolean
}

export const CUSTOM_TEMPLATES: ProviderTemplate[] = [
  { id: 'openai-compatible', displayName: 'OpenAI Compatible', category: 'custom', icon: 'completions', baseURL: 'https://api.example.com/v1', api: 'openai-completions', hint: '/v1/chat/completions · openai-completions' },
  { id: 'anthropic-compatible', displayName: 'Anthropic Compatible', category: 'custom', icon: 'anthropiccompat', baseURL: 'https://api.example.com/v1', api: 'anthropic-messages', hint: '/v1/messages · anthropic-messages' },
  { id: 'openai-responses', displayName: 'OpenAI Responses', category: 'custom', icon: 'responses', baseURL: 'https://api.example.com/v1', api: 'openai-responses', hint: 'Responses API · openai-responses' },
  { id: 'google-generative-ai', displayName: 'Google Generative AI', category: 'custom', icon: 'google', hint: 'generativelanguage.googleapis.com · google-generative-ai', oauthOnly: false },
]

export const SUBSCRIPTION_TEMPLATES: ProviderTemplate[] = [
  { id: 'github-copilot', displayName: 'GitHub Copilot', category: 'subscription', icon: 'copilot', oauthOnly: true },
  { id: 'kimi-for-coding', displayName: 'Kimi For Coding', category: 'subscription', icon: 'kimi', oauthOnly: true },
  { id: 'chatgpt-plus-pro', displayName: 'ChatGPT Plus/Pro', category: 'subscription', icon: 'openai', oauthOnly: true },
  { id: 'openrouter-oauth', displayName: 'OpenRouter', category: 'subscription', icon: 'openrouter', oauthOnly: true },
  { id: 'xai-oauth', displayName: 'xAI', category: 'subscription', icon: 'xai', oauthOnly: true },
]

export const API_KEY_TEMPLATES: ProviderTemplate[] = [
  { id: 'openrouter', displayName: 'OpenRouter', category: 'api-key', icon: 'openrouter', baseURL: 'https://openrouter.ai/api/v1', api: 'openai-completions', credentialRef: 'OPENROUTER_API_KEY', models: 362 },
  { id: 'openai', displayName: 'OpenAI', category: 'api-key', icon: 'openai', baseURL: 'https://api.openai.com/v1', api: 'openai-responses', credentialRef: 'OPENAI_API_KEY', models: 39 },
  { id: 'anthropic', displayName: 'Anthropic', category: 'api-key', icon: 'anthropic', baseURL: 'https://api.anthropic.com', api: 'anthropic-messages', credentialRef: 'ANTHROPIC_API_KEY', models: 11 },
  { id: 'deepseek', displayName: 'DeepSeek', category: 'api-key', icon: 'deepseek', baseURL: 'https://api.deepseek.com', api: 'openai-completions', credentialRef: 'DEEPSEEK_API_KEY', models: 6 },
  { id: 'moonshotai', displayName: 'Moonshot AI', category: 'api-key', icon: 'moonshot', baseURL: 'https://api.moonshot.ai/v1', api: 'openai-completions', credentialRef: 'MOONSHOT_API_KEY', models: 10 },
  { id: 'moonshotai-cn', displayName: 'Moonshot AI CN', category: 'api-key', icon: 'moonshot', baseURL: 'https://api.moonshot.cn/v1', api: 'openai-completions', credentialRef: 'MOONSHOT_API_KEY', models: 10 },
  { id: 'zai', displayName: 'Z.AI', category: 'api-key', icon: 'zai', baseURL: 'https://api.z.ai/api/coding/paas/v4', api: 'openai-completions', credentialRef: 'ZAI_API_KEY', models: 7 },
  { id: 'zai-coding-cn', displayName: 'Z.AI Coding CN', category: 'api-key', icon: 'zai', baseURL: 'https://open.bigmodel.cn/api/coding/paas/v4', api: 'openai-completions', credentialRef: 'ZAI_CODING_CN_API_KEY', models: 10 },
  { id: 'minimax', displayName: 'MiniMax', category: 'api-key', icon: 'minimax', baseURL: 'https://api.minimax.io/anthropic', api: 'anthropic-messages', credentialRef: 'MINIMAX_API_KEY', models: 3 },
  { id: 'minimax-cn', displayName: 'MiniMax CN', category: 'api-key', icon: 'minimax', baseURL: 'https://api.minimaxi.com/anthropic', api: 'anthropic-messages', credentialRef: 'MINIMAX_CN_API_KEY', models: 3 },
  { id: 'qwen-token-plan', displayName: 'Qwen Token Plan', category: 'api-key', icon: 'qwen', baseURL: 'https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1', api: 'openai-completions', credentialRef: 'QWEN_TOKEN_PLAN_API_KEY', models: 18 },
  { id: 'qwen-token-plan-cn', displayName: 'Qwen Token Plan CN', category: 'api-key', icon: 'qwen', baseURL: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1', api: 'openai-completions', credentialRef: 'QWEN_TOKEN_PLAN_CN_API_KEY', models: 18 },
  { id: 'xai', displayName: 'xAI', category: 'api-key', icon: 'xai', baseURL: 'https://api.x.ai/v1', api: 'openai-responses', credentialRef: 'XAI_API_KEY', models: 3 },
  { id: 'google', displayName: 'Google', category: 'api-key', icon: 'google', baseURL: 'https://generativelanguage.googleapis.com/v1beta', api: 'openai-completions', credentialRef: 'GEMINI_API_KEY', models: 22 },
  { id: 'mistral', displayName: 'Mistral', category: 'api-key', icon: 'mistral', baseURL: 'https://api.mistral.ai', api: 'openai-completions', credentialRef: 'MISTRAL_API_KEY', models: 32 },
  { id: 'nvidia', displayName: 'NVIDIA', category: 'api-key', icon: 'nvidia', baseURL: 'https://integrate.api.nvidia.com/v1', api: 'openai-completions', credentialRef: 'NVIDIA_API_KEY', models: 20 },
  { id: 'xiaomi', displayName: 'Xiaomi MiMo', category: 'api-key', icon: 'xiaomi', baseURL: 'https://api.xiaomimimo.com/v1', api: 'openai-completions', credentialRef: 'XIAOMI_API_KEY', models: 3 },
  { id: 'xiaomi-token-plan-cn', displayName: 'Xiaomi Token Plan CN', category: 'api-key', icon: 'xiaomi', baseURL: 'https://token-plan-cn.xiaomimimo.com/v1', api: 'openai-completions', credentialRef: 'XIAOMI_TOKEN_PLAN_CN_API_KEY', models: 2 },
  { id: 'together', displayName: 'Together', category: 'api-key', icon: 'together', baseURL: 'https://api.together.ai/v1', api: 'openai-completions', credentialRef: 'TOGETHER_API_KEY', models: 21 },
  { id: 'fireworks', displayName: 'Fireworks', category: 'api-key', icon: 'fireworks', baseURL: 'https://api.fireworks.ai/inference/v1', api: 'openai-completions', credentialRef: 'FIREWORKS_API_KEY', models: 19 },
  { id: 'groq', displayName: 'Groq', category: 'api-key', icon: 'groq', baseURL: 'https://api.groq.com/openai/v1', api: 'openai-completions', credentialRef: 'GROQ_API_KEY', models: 9 },
  { id: 'baseten', displayName: 'Baseten', category: 'api-key', icon: 'baseten', baseURL: 'https://inference.baseten.co/v1', api: 'openai-completions', credentialRef: 'BASETEN_API_KEY', models: 20 },
  { id: 'cerebras', displayName: 'Cerebras', category: 'api-key', icon: 'cerebras', baseURL: 'https://api.cerebras.ai/v1', api: 'openai-completions', credentialRef: 'CEREBRAS_API_KEY', models: 2 },
  { id: 'huggingface', displayName: 'Hugging Face', category: 'api-key', icon: 'huggingface', baseURL: 'https://router.huggingface.co/v1', api: 'openai-completions', credentialRef: 'HF_TOKEN', models: 71 },
  { id: 'ant-ling', displayName: 'Ant Ling', category: 'api-key', icon: 'antling', baseURL: 'https://api.ant-ling.com/v1', api: 'openai-completions', credentialRef: 'ANT_LING_API_KEY', models: 3 },
  { id: 'opencode', displayName: 'OpenCode Zen', category: 'api-key', icon: 'opencode', credentialRef: 'OPENCODE_API_KEY', models: 63 },
  { id: 'vercel-ai-gateway', displayName: 'Vercel AI Gateway', category: 'api-key', icon: 'vercel', baseURL: 'https://ai-gateway.vercel.sh', api: 'anthropic-messages', credentialRef: 'AI_GATEWAY_API_KEY', models: 233 },
  { id: 'cloudflare-ai-gateway', displayName: 'Cloudflare AI Gateway', category: 'api-key', icon: 'cloudflare', models: 50 },
  { id: 'kimi-for-coding-api', displayName: 'Kimi For Coding (API)', category: 'api-key', icon: 'kimi', baseURL: 'https://api.kimi.com/coding', api: 'anthropic-messages', credentialRef: 'KIMI_API_KEY', models: 4 },
]

export const ALL_TEMPLATES: readonly ProviderTemplate[] = [
  ...CUSTOM_TEMPLATES,
  ...SUBSCRIPTION_TEMPLATES,
  ...API_KEY_TEMPLATES,
]

export function templatesByCategory(): { custom: ProviderTemplate[]; subscription: ProviderTemplate[]; apiKey: ProviderTemplate[] } {
  return {
    custom: CUSTOM_TEMPLATES,
    subscription: SUBSCRIPTION_TEMPLATES,
    apiKey: API_KEY_TEMPLATES,
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
  { icon: 'google', brandName: 'Google', patterns: [/google|gemini|generativelanguage/iu] },
  { icon: 'moonshot', brandName: 'Moonshot AI', patterns: [/moonshot|kimi/iu] },
  { icon: 'minimax', brandName: 'MiniMax', patterns: [/minimax/iu] },
  { icon: 'zai', brandName: 'Z.AI', patterns: [/z-?ai|bigmodel|glm|zhipu/iu] },
  { icon: 'qwen', brandName: 'Qwen', patterns: [/qwen|alibaba|aliyun|dashscope/iu] },
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
  { icon: 'copilot', brandName: 'GitHub Copilot', patterns: [/copilot|github/iu] },
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

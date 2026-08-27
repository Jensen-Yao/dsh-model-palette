import type { IApiClient } from '@deepseek-ai/dsh-api-remotes/client'
import { providerProfiles, repairProviderCompatibility } from './model-config.ts'

const SETTINGS_NAMESPACE = 'llm-pi-ai'

/** Whether a catalog choice may need DeepSeek replay compatibility on a custom route. */
export function mayNeedReasoningCompatibility(
  providerId: string,
  modelId: string,
  modelName: string,
): boolean {
  if (providerId === 'deepseek') return false
  return `${modelId} ${modelName}`.toLocaleLowerCase().includes('deepseek')
}

/**
 * Repair the selected user-configured model before DSH switches to it.
 * Static or inherited routes remain untouched.
 */
export async function ensureSelectionCompatibility(
  api: Pick<IApiClient, 'settings'>,
  providerId: string,
  modelId: string,
): Promise<string[]> {
  const described = await api.settings.describe({})
  if (!described.result.ok) throw new Error(described.result.error.message)
  const namespace = described.result.value.namespaces.find(candidate => candidate.ns === SETTINGS_NAMESPACE)
  if (namespace === undefined) return []
  const profiles = providerProfiles(namespace.user ?? namespace.value)
  const profile = profiles[providerId]
  if (profile === undefined) return []
  const repaired = repairProviderCompatibility(profile, modelId)
  if (!repaired.changed) return []
  const mutation = await api.settings.mutate({
    ns: SETTINGS_NAMESPACE,
    ops: [{ op: 'set', path: ['providers', providerId], value: repaired.profile }],
    expectedRevision: namespace.revision,
  })
  if (!mutation.result.ok) throw new Error(mutation.result.error.message)
  return repaired.repairedModels
}

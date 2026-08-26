interface ConfigApiSuccess<T> {
  ok: true
  value: T
}

interface ConfigApiFailure {
  ok: false
  error?: { message?: string }
}

const CONFIG_API_BASE = '/model-palette/api/config'

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

import { describe, expect, it, vi } from 'vitest'
import { paletteApi } from '../src/client/remote-compat.ts'

describe('paletteApi', () => {
  it('adapts alpha.3 positional Remotes and modelCatalog', async () => {
    const settingsDescribe = vi.fn(async () => ({ ok: true, value: { namespaces: [] } }))
    const settingsMutate = vi.fn(async () => ({ ok: true, value: { ns: 'test' } }))
    const credentialsDescribe = vi.fn(async () => ({ ok: true, value: { KEY: { configured: true, writable: true } } }))
    const credentialsSet = vi.fn(async () => ({ ok: true, value: undefined }))
    const discoverModels = vi.fn(async () => ({ ok: true, value: [{ id: 'model' }] }))
    const modelCatalog = vi.fn(async () => ({ ok: true, value: { groups: [] } }))
    const api = paletteApi({
      settings: { describe: settingsDescribe, mutate: settingsMutate },
      credentials: { describe: credentialsDescribe, set: credentialsSet },
      llm: { discoverModels },
      session: { modelCatalog },
    } as never)

    await expect(api.settings.describe({})).resolves.toEqual({ result: { ok: true, value: { namespaces: [] } } })
    await expect(api.settings.mutate({ ns: 'test', ops: [], expectedRevision: 3 })).resolves.toEqual({
      result: { ok: true, value: { ns: 'test' } },
    })
    await expect(api.credentials.describe({ refs: ['KEY'] })).resolves.toEqual({
      result: { ok: true, value: { credentials: { KEY: { configured: true, writable: true } } } },
    })
    await expect(api.credentials.set({ ref: 'KEY', value: 'secret' })).resolves.toEqual({
      result: { ok: true, value: undefined },
    })
    await expect(api.llm.discoverModels({ settingsNs: 'llm-pi-ai', provider: 'test' })).resolves.toEqual({
      result: { ok: true, value: { models: [{ id: 'model' }] } },
    })
    await expect(api.llm.models({})).resolves.toEqual({ result: { ok: true, value: { groups: [] } } })

    expect(settingsMutate).toHaveBeenCalledWith('test', [], 3)
    expect(credentialsDescribe).toHaveBeenCalledWith(['KEY'])
    expect(credentialsSet).toHaveBeenCalledWith('KEY', 'secret')
    expect(discoverModels).toHaveBeenCalledWith('llm-pi-ai', { provider: 'test' })
    expect(modelCatalog).toHaveBeenCalledWith()
  })

  it('rejects non-JSON settings values before invoking the Remote', async () => {
    const settingsMutate = vi.fn()
    const api = paletteApi({ settings: { mutate: settingsMutate } } as never)

    await expect(api.settings.mutate({
      ns: 'test',
      ops: [{ op: 'set', path: ['value'], value: Number.NaN }],
    })).rejects.toThrow('settings operation 0 value must contain only finite JSON numbers')
    expect(settingsMutate).not.toHaveBeenCalled()
  })
})

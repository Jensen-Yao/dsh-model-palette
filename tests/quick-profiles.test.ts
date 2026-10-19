import { describe, expect, it } from 'vitest'
import { moveQuickProfile, parseQuickProfiles, sameSelection, saveQuickProfile, type QuickProfile } from '../src/client/quick-profiles.ts'

const coding: QuickProfile = { id: 'coding', name: '写代码', selection: { provider: 'route', model: 'reasoner', reasoningEffort: 'high' } }
const fast: QuickProfile = { id: 'fast', name: '快问', selection: { provider: 'route', model: 'fast' } }

describe('quick profiles', () => {
  it('stores only exact selections, stripping unrelated storage fields and invalid entries', () => {
    const parsed = parseQuickProfiles([null, { ...coding, apiKey: 'do-not-store', selection: { ...coding.selection, apiKey: 'also-not-stored' } },
      { ...fast, name: ' 快问 ' }, { ...coding, name: 'duplicate id' }, { ...fast, id: 'other', name: '快问' },
      { id: 'bad', name: 'Bad', selection: { provider: '', model: 'a' } },
      { id: 'bad-effort', name: 'Bad', selection: { provider: 'p', model: 'a', reasoningEffort: 4 } },
    ])
    expect(parsed).toEqual([coding, fast])
    expect(parsed[0]).not.toBe(coding)
    expect(parseQuickProfiles({ profiles: [coding] })).toEqual([])
  })

  it('updates an existing name in place and preserves its slot and id', () => {
    const saved = saveQuickProfile([coding, fast], { id: 'new-id', name: ' 写代码 ', selection: fast.selection })
    expect(saved).toEqual([{ ...coding, selection: fast.selection }, fast])
    expect(coding.selection.reasoningEffort).toBe('high')
    expect(saveQuickProfile([coding], { ...coding, name: 'Coding' })[0]?.name).toBe('Coding')
    expect(() => saveQuickProfile([coding, fast], { ...coding, name: '快问' })).toThrow('quick.nameTaken')
  })

  it('limits names and counts while allowing updates at capacity', () => {
    const profiles = Array.from({ length: 12 }, (_, i) => ({ ...coding, id: String(i), name: `Profile ${i}` }))
    expect(parseQuickProfiles([...profiles, fast])).toHaveLength(12)
    expect(() => saveQuickProfile(profiles, fast)).toThrow('quick.limit')
    expect(saveQuickProfile(profiles, { ...profiles[0]!, selection: fast.selection })).toHaveLength(12)
    expect(() => saveQuickProfile([], { ...coding, name: '  ' })).toThrow('quick.nameInvalid')
    expect(() => saveQuickProfile([], { ...coding, name: 'a'.repeat(41) })).toThrow('quick.nameInvalid')
  })

  it('reorders quick-key slots without mutating the original list', () => {
    const profiles = [coding, fast]
    expect(moveQuickProfile(profiles, 'fast', -1)).toEqual([fast, coding])
    expect(moveQuickProfile(profiles, 'coding', -1)).toEqual(profiles)
    expect(moveQuickProfile(profiles, 'missing', 1)).toEqual(profiles)
    expect(profiles).toEqual([coding, fast])
  })

  it('distinguishes provider-default effort from an explicit saved level', () => {
    expect(sameSelection(coding.selection, { ...coding.selection })).toBe(true)
    expect(sameSelection(coding.selection, { provider: 'route', model: 'reasoner' })).toBe(false)
    expect(sameSelection(null, coding.selection)).toBe(false)
    expect(sameSelection({ provider: 'route', model: 'a' }, { provider: 'other', model: 'a' })).toBe(false)
  })
})

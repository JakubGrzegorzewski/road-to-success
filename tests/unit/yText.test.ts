import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { applyStringToYText, diffStrings, transformPosition } from '@/scripts/store/yText'

describe('diffStrings', () => {
    it('finds the minimal changed range', () => {
        expect(diffStrings('abc', 'abc')).toBeNull()
        expect(diffStrings('abc', 'abXc')).toEqual({ index: 2, deleteCount: 0, insert: 'X' })
        expect(diffStrings('abcdef', 'abef')).toEqual({ index: 2, deleteCount: 2, insert: '' })
        expect(diffStrings('', 'nowy')).toEqual({ index: 0, deleteCount: 0, insert: 'nowy' })
        expect(diffStrings('zażółć', 'zażółć gęślą')).toEqual({ index: 6, deleteCount: 0, insert: ' gęślą' })
    })

    it('never splits surrogate pairs', () => {
        const change = diffStrings('a😀b', 'a😃b')!
        expect(change.index).toBe(1)
        expect(change.deleteCount).toBe(2)
        expect(change.insert).toBe('😃')
    })
})

describe('applyStringToYText', () => {
    it('merges concurrent edits made in different places', () => {
        const a = new Y.Doc()
        const b = new Y.Doc()
        const ta = a.getText('t')
        const tb = b.getText('t')
        applyStringToYText(ta, 'Zbiórka zastępu', 'local')
        Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
        applyStringToYText(ta, 'Pierwsza zbiórka zastępu', 'local')
        applyStringToYText(tb, 'Zbiórka zastępu Wilki', 'local')
        Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
        Y.applyUpdate(a, Y.encodeStateAsUpdate(b))
        expect(ta.toString()).toBe(tb.toString())
        expect(ta.toString()).toContain('Wilki')
        expect(ta.toString()).toMatch(/^Pierwsza z?Z?biórka/)
    })
})

describe('transformPosition', () => {
    it('keeps the caret in place across remote edits', () => {
        // "abc|def"
        expect(transformPosition(3, [{ retain: 1 }, { insert: 'X' }])).toBe(4)
        expect(transformPosition(3, [{ retain: 1 }, { delete: 1 }])).toBe(2)
        expect(transformPosition(3, [{ retain: 2 }, { delete: 3 }])).toBe(2)
        expect(transformPosition(3, [{ retain: 5 }, { insert: 'X' }])).toBe(3)
        expect(transformPosition(3, [{ retain: 3 }, { insert: 'X' }])).toBe(3)
    })
})

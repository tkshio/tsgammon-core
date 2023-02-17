import { BoardStateNode } from '../../BoardStateNode'
import { boardStateNodeFromArray } from '../../BoardStateNodeBuilders'
import { standardConf } from '../../GameConfs'
import { standardRuleSet } from '../../rules/standardRuleSet'
import { wrapNode } from '../../utils/wrapNode'

const rootNode = boardStateNodeFromArray(
    standardConf.initialPos,
    1,
    3,
    standardRuleSet
)

describe('wrapRootNode.apply()', () => {
    test('applies apply() for major node first(default, apply success for major node)', () => {
        const ret = wrapNode(rootNode).apply(catchMajor).unwrap
        expect(ret.hasValue).toBeTruthy()
    })
    test('applies apply() for major node first(default, apply success for minor node)', () => {
        const ret = wrapNode(rootNode).apply(catchMinor).unwrap
        expect(ret.hasValue).toBeTruthy()
    })
    test('applies apply() for minor node first(apply success for minor node)', () => {
        const ret = wrapNode(rootNode, true).apply(catchMinor).unwrap
        expect(ret.hasValue).toBeTruthy()
    })
    test('applies apply() for minor node first(apply success for major node)', () => {
        const ret = wrapNode(rootNode, true).apply(catchMajor).unwrap
        expect(ret.hasValue).toBeTruthy()
    })

    test('applies apply() for major node first(default, apply fail)', () => {
        const ret = wrapNode(rootNode).apply((_) => ({
            hasValue: false,
        })).unwrap
        expect(ret.hasValue).toBeFalsy()
    })

    function catchMajor(
        node: BoardStateNode
    ): BoardStateNode | { hasValue: false } {
        const n = node.childNode(1)
        return n.hasValue && n.board.piecesAt(4) == 1 ? n : { hasValue: false }
    }
    function catchMinor(
        node: BoardStateNode
    ): BoardStateNode | { hasValue: false } {
        const n = node.childNode(1)
        return n.hasValue && n.board.piecesAt(2) == 1 ? n : { hasValue: false }
    }
})
describe('wrapRootNode.or()', () => {
    test('applies or() when apply() failed', () => {
        const g = { count: 0 }
        const ret = wrapNode(rootNode)
            .apply((_) => ({ hasValue: false }))
            .or((node) => {
                g.count++
                // first or() must be called with major node of root node
                return isMajor(node)
            }).unwrap
        expect(g.count).toBe(1)
        expect(ret.hasValue).toBeTruthy()
    })
    test('applies or() with the minor first order', () => {
        const g = { count: 0 }
        const ret = wrapNode(rootNode, true)
            .apply((_) => ({ hasValue: false }))
            .or((node) => {
                // first or() must be called with minor node
                g.count++
                return isMinor(node)
            }).unwrap
        expect(g.count).toBe(1)
        expect(ret.hasValue).toBeTruthy()
    })
    test('applies or() for major first, then minor', () => {
        const g = { count: 0 }
        const ret = wrapNode(rootNode)
            .apply((_) => ({ hasValue: false }))
            .or((node) => {
                // first or() must be called with minor node
                g.count++
                return isMinor(node)
            }).unwrap
        expect(g.count).toBe(2)
        expect(ret.hasValue).toBeTruthy()
    })

    function isMajor(
        node: BoardStateNode
    ): BoardStateNode | { hasValue: false } {
        return node.hasValue &&
            node.board.piecesAt(1) == 2 &&
            node.dices[0].pip == 3
            ? node
            : { hasValue: false }
    }
    function isMinor(
        node: BoardStateNode
    ): BoardStateNode | { hasValue: false } {
        return node.hasValue &&
            node.board.piecesAt(1) == 2 &&
            node.dices[0].pip == 1
            ? node
            : { hasValue: false }
    }
})

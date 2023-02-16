import { boardStateNodeFromArray } from '../../BoardStateNodeBuilders'
import { standardConf } from '../../GameConfs'
import { standardRuleSet } from '../../rules/standardRuleSet'
import { wrapNode } from '../../utils/wrapNode'

describe('wrapRootNode', () => {
    const rootNode = boardStateNodeFromArray(
        standardConf.initialPos,
        1,
        3,
        standardRuleSet
    )
    test('applies apply() for major node first(default, apply success for major node)', () => {
        const ret = wrapNode(rootNode).apply((node) => {
            const n = node.childNode(1)
            return n.hasValue && n.board.piecesAt(4) == 1
                ? n
                : { hasValue: false }
        }).unwrap
        expect(ret.hasValue).toBeTruthy()
    })
    test('applies apply() for major node first(default, apply success for minor node)', () => {
        const ret = wrapNode(rootNode).apply((node) => {
            const n = node.childNode(1)
            return n.hasValue && n.board.piecesAt(2) == 1
                ? n
                : { hasValue: false }
        }).unwrap
        expect(ret.hasValue).toBeTruthy()
    })
    test('applies apply() for minor node first(apply success for minor node)', () => {
        const ret = wrapNode(rootNode, true).apply((node) => {
            const n = node.childNode(1)
            return n.hasValue && n.board.piecesAt(2) == 1
                ? n
                : { hasValue: false }
        }).unwrap
        expect(ret.hasValue).toBeTruthy()
    })
    test('applies apply() for minor node first(apply success for major node)', () => {
        const ret = wrapNode(rootNode, true).apply((node) => {
            const n = node.childNode(1)
            return n.hasValue && n.board.piecesAt(4) == 1
                ? n
                : { hasValue: false }
        }).unwrap
        expect(ret.hasValue).toBeTruthy()
    })

    test('applies apply() for major node first(default, apply fail)', () => {
        const ret = wrapNode(rootNode).apply((_) => {
            return { hasValue: false }
        }).unwrap
        expect(ret.hasValue).toBeFalsy()
    })
    test('applies or() when apply() failed', () => {
        const ret = wrapNode(rootNode)
            .apply((_) => ({ hasValue: false }))
            .or((node) =>
                // first or() must be called with major node of root node
                node.hasValue &&
                node.board.piecesAt(1) == 2 &&
                node.dices[0].pip == 3
                    ? node
                    : { hasValue: false }
            ).unwrap
        expect(ret.hasValue).toBeTruthy()
    })
})

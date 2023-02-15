import { boardStateNodeFromArray } from '../../../BoardStateNodeBuilders'
import { standardConf } from '../../../GameConfs'
import { wrapRootNode } from '../../../RootBoardStateNodeUtils'
import { makeLeap } from '../../../utils/makeLeap'

describe('makeLeap()', () => {
    const node = boardStateNodeFromArray(
        //prettier-ignore
        [0,
            1, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
         0],
        1,
        2,
        standardConf.transition.ruleSet
    )
    test('returns node if a piece can be moved to pos', () => {
        expect(
            wrapRootNode(node, true).apply((node) => makeLeap(node, 2)).unwrap
                .hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(node, false).apply((node) => makeLeap(node, 2)).unwrap
                .hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(node, true).apply((node) => makeLeap(node, 3)).unwrap
                .hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(node, false).apply((node) => makeLeap(node, 3)).unwrap
                .hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(node, true).apply((node) => makeLeap(node, 4)).unwrap
                .hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(node, false).apply((node) => makeLeap(node, 4)).unwrap
                .hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(node, true).apply((node) => makeLeap(node, 5)).unwrap
                .hasValue
        ).toBeFalsy()
        expect(
            wrapRootNode(node, false).apply((node) => makeLeap(node, 5)).unwrap
                .hasValue
        ).toBeFalsy()
    })

    const nodeWithBlock = boardStateNodeFromArray(
        //prettier-ignore
        [0,
            1, -2, -2, 0, 0, 0,  0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
         0],
        1,
        2,
        standardConf.transition.ruleSet
    )
    test('returns no node if no piece can be moved, because of blocks', () => {
        expect(
            wrapRootNode(nodeWithBlock, true).apply((node) => makeLeap(node, 4))
                .unwrap.hasValue
        ).toBeFalsy()
    })

    test('respects pieces on the bar', () => {
        const nodeWithOnTheBar = boardStateNodeFromArray(
            //prettier-ignore
            [2,
                -2, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
             0],
            1,
            2,
            standardConf.transition.ruleSet
        )

        expect(
            wrapRootNode(nodeWithOnTheBar, true).apply((node) =>
                makeLeap(node, 2)
            ).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(nodeWithOnTheBar, true).apply((node) =>
                makeLeap(node, 3)
            ).unwrap.hasValue
        ).toBeFalsy()
    })
    const nodeWithBlots = boardStateNodeFromArray(
        //prettier-ignore
        [0,
            1, -1, -1, 0, 0, 0,  0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
         0],
        1,
        2,
        standardConf.transition.ruleSet
    )
    test('consumes major pip first if last arg is false', () => {
        const found = wrapRootNode(nodeWithBlots, false).apply((node) =>
            makeLeap(node, 4)
        ).unwrap
        expect(found.hasValue).toBeTruthy()
        expect(found.hasValue ? found.board.piecesAt(25) : 0).toBe(-1)
        expect(found.hasValue ? found.board.piecesAt(3) : -1).toBe(0)
    })

    test('consumes minor pip first if last arg is true', () => {
        const found = wrapRootNode(nodeWithBlots, true).apply((node) =>
            makeLeap(node, 4)
        ).unwrap
        expect(found.hasValue).toBeTruthy()
        expect(found.hasValue ? found.board.piecesAt(25) : 0).toBe(-1)
        expect(found.hasValue ? found.board.piecesAt(2) : -1).toBe(0)
    })

    const nodeWithDoublets = boardStateNodeFromArray(
        //prettier-ignore
        [0,
            1, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
            0],
        2,
        2,
        standardConf.transition.ruleSet
    )

    test('consumes arbitary nums of doublet', () => {
        expect(
            wrapRootNode(nodeWithDoublets, true).apply((node) =>
                makeLeap(node, 3)
            ).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(nodeWithDoublets, true).apply((node) =>
                makeLeap(node, 5)
            ).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(nodeWithDoublets, true).apply((node) =>
                makeLeap(node, 7)
            ).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(nodeWithDoublets, true).apply((node) =>
                makeLeap(node, 9)
            ).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrapRootNode(nodeWithDoublets, true).apply((node) =>
                makeLeap(node, 11)
            ).unwrap.hasValue
        ).toBeFalsy()
    })
})

import { wrap } from '../../../BoardStateNode'
import { boardStateNodeFromArray } from '../../../BoardStateNodeBuilders'
import { standardConf } from '../../../GameConfs'
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
    test('returns node if piece can be moved to pos', () => {
        expect(
            wrap(node).apply((node) => makeLeap(node, 2, true)).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(node).apply((node) => makeLeap(node, 2, false)).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(node).apply((node) => makeLeap(node, 3, true)).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(node).apply((node) => makeLeap(node, 3, false)).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(node).apply((node) => makeLeap(node, 4, true)).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(node).apply((node) => makeLeap(node, 4, false)).unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(node).apply((node) => makeLeap(node, 5, true)).unwrap.hasValue
        ).toBeFalsy()
        expect(
            wrap(node).apply((node) => makeLeap(node, 5, false)).unwrap.hasValue
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
            wrap(nodeWithBlock).apply((node) => makeLeap(node, 4, true)).unwrap
                .hasValue
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
            wrap(nodeWithOnTheBar).apply((node) => makeLeap(node, 2, true))
                .unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(nodeWithOnTheBar).apply((node) => makeLeap(node, 3, true))
                .unwrap.hasValue
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
        const found = wrap(nodeWithBlots).apply((node) =>
            makeLeap(node, 4, false)
        ).unwrap
        expect(found.hasValue).toBeTruthy()
        expect(found.hasValue ? found.board.piecesAt(25) : 0).toBe(-1)
        expect(found.hasValue ? found.board.piecesAt(3) : -1).toBe(0)
    })

    test('consumes minor pip first if last arg is true', () => {
        const found = wrap(nodeWithBlots).apply((node) =>
            makeLeap(node, 4, true)
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
            wrap(nodeWithDoublets).apply((node) => makeLeap(node, 3, true))
                .unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(nodeWithDoublets).apply((node) => makeLeap(node, 5, true))
                .unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(nodeWithDoublets).apply((node) => makeLeap(node, 7, true))
                .unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(nodeWithDoublets).apply((node) => makeLeap(node, 9, true))
                .unwrap.hasValue
        ).toBeTruthy()
        expect(
            wrap(nodeWithDoublets).apply((node) => makeLeap(node, 11, true))
                .unwrap.hasValue
        ).toBeFalsy()
    })
})

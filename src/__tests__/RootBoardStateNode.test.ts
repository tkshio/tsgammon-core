import { boardState } from '../BoardState'
import { boardStateNode } from '../BoardStateNodeBuilders'
import { standardConf } from '../GameConfs'

describe('RootBoardStateNode', () => {
    test('holds dice rolls in rolled order', () => {
        const root1 = boardStateNode(boardState(standardConf.initialPos), {
            dice1: 1,
            dice2: 3,
        })
        expect(root1.dices).toEqual([
            { pip: 1, used: false },
            { pip: 3, used: false },
        ])
        const root2 = boardStateNode(boardState(standardConf.initialPos), {
            dice1: 3,
            dice2: 1,
        })
        expect(root2.dices).toEqual([
            { pip: 3, used: false },
            { pip: 1, used: false },
        ])
        expect(root1.alternate).toBeDefined()
        expect(root2.alternate).toBeDefined()
    })
    test('holds dice rolls in rolled order, even though major pip is unavailable', () => {
        const board = boardState(
            // prettier-ignore
            [
            0,
            0, 0, 0, 0, 0, 0, /* */ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, /* */ 0, 1, 0,-2,-2,-2,
            0,
        ]
        )
        const root1 = boardStateNode(board, {
            dice1: 1,
            dice2: 3,
        })
        expect(root1.dices).toEqual([
            { pip: 1, used: false },
            { pip: 3, used: true },
        ])
        const root2 = boardStateNode(board, {
            dice1: 3,
            dice2: 1,
        })
        expect(root2.dices).toEqual([
            { pip: 3, used: true },
            { pip: 1, used: false },
        ])
        expect(root1.alternate).toBeUndefined()
        expect(root2.alternate).toBeUndefined()
    })
    test('holds dice rolls in rolled order, even though minor pip is unavailable', () => {
        const board = boardState(
            // prettier-ignore
            [
            0,
            0, 0, 0, 0, 0, 0, /* */ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, /* */ 0, 1,-2,-2, 0,-2,
            0,
        ]
        )
        const root1 = boardStateNode(board, {
            dice1: 1,
            dice2: 3,
        })
        expect(root1.dices).toEqual([
            { pip: 1, used: true },
            { pip: 3, used: false },
        ])
        const root2 = boardStateNode(board, {
            dice1: 3,
            dice2: 1,
        })
        expect(root2.dices).toEqual([
            { pip: 3, used: false },
            { pip: 1, used: true },
        ])
        expect(root1.alternate).toBeUndefined()
        expect(root2.alternate).toBeUndefined()
    })
    test('holds dice rolls in rolled order when both pips are unavailable', () => {
        const board = boardState(
            // prettier-ignore
            [
            0,
            0, 0, 0, 0, 0, 0, /* */ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, /* */ 0, 1,-2,-2,-2,-2,
            0,
        ]
        )
        const root1 = boardStateNode(board, {
            dice1: 1,
            dice2: 3,
        })
        expect(root1.dices).toEqual([
            { pip: 1, used: true },
            { pip: 3, used: true },
        ])
        const root2 = boardStateNode(board, {
            dice1: 3,
            dice2: 1,
        })
        expect(root2.dices).toEqual([
            { pip: 3, used: true },
            { pip: 1, used: true },
        ])
        expect(root1.alternate).toBeUndefined()
        expect(root2.alternate).toBeUndefined()
    })

    test('holds dice rolls in rolled order when minor pip must be used first', () => {
        const board = boardState(
            // prettier-ignore
            [
                0,
                0,-2, 0,-2,-2,-2, /* bar */-2, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 0, /* bar */ 0, 0, 1,-2, 0, 0,
                0,
            ]
        )
        const root1 = boardStateNode(board, {
            dice1: 2,
            dice2: 5,
        })
        expect(root1.dices).toEqual([
            { pip: 2, used: false },
            { pip: 5, used: false },
        ])
        const root2 = boardStateNode(board, {
            dice1: 5,
            dice2: 2,
        })
        expect(root2.dices).toEqual([
            { pip: 5, used: false },
            { pip: 2, used: false },
        ])
        expect(root1.alternate).toBeUndefined()
        expect(root2.alternate).toBeUndefined()
    })
})

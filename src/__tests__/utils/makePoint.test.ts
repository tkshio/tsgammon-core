import { boardState } from '../../BoardState'
import { boardStateNode } from '../../BoardStateNodeBuilders'
import { BoardStateNodeRoot } from '../../BoardStateNodeRoot'
import { standardConf } from '../../GameConfs'
import { makePoint } from '../../utils/makePoint'
import { wrapNode } from '../../utils/wrapNode'

const initialPos = standardConf.initialPos

function makePointRootNode(
    root: BoardStateNodeRoot,
    swap: boolean,
    pos: number
) {
    return wrapNode(root, swap).apply((node) => makePoint(node, pos)).unwrap
}
describe('makePoint', () => {
    test('returns node for point-making', () => {
        doPointMakeTest(false)
    })
    test('returns node for point-making(swap)', () => {
        doPointMakeTest(true)
    })
    function doPointMakeTest(swap: boolean) {
        const node = boardStateNode(boardState(initialPos), {
            dice1: 3,
            dice2: 1,
        })
        const point2 = makePointRootNode(node, swap, 2)
        expect(point2.hasValue).toBeFalsy()
        const point20 = makePointRootNode(node, swap, 20)
        expect(point20.hasValue).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(20) === 2
        ).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(19) === 4
        ).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(17) === 2
        ).toBeTruthy()
        const point21 = makePointRootNode(node, swap, 21)
        expect(point21.hasValue).toBeFalsy()
    }

    test('returns node for point-making(minor roll first)', () => {
        doPointMakeTest_minorFirst(false)
    })
    test('returns node for point-making(minor roll first, swap)', () => {
        doPointMakeTest_minorFirst(true)
    })

    function doPointMakeTest_minorFirst(swap: boolean) {
        const node = boardStateNode(boardState(initialPos), {
            dice1: 1,
            dice2: 3,
        })
        const point2 = makePointRootNode(node, swap, 2)
        expect(point2.hasValue).toBeFalsy()
        const point20 = makePointRootNode(node, swap, 20)
        expect(point20.hasValue).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(20) === 2
        ).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(19) === 4
        ).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(17) === 2
        ).toBeTruthy()
        const point21 = makePointRootNode(node, swap, 21)
        expect(point21.hasValue).toBeFalsy()
    }

    test('requires 2 unused dice', () => {
        const node = boardStateNode(boardState(initialPos), {
            dice1: 1,
            dice2: 3,
        }).primary.childNode(19)
        if (!node.hasValue) {
            throw Error()
        }
        const point20 = makePoint(node, 20)
        expect(point20.hasValue).toBeFalsy()
        const point21 = makePoint(node, 21)
        expect(point21.hasValue).toBeFalsy()
    })
    test('returns node for point-making(doublet)', () => {
        const node = boardStateNode(boardState(initialPos), {
            dice1: 1,
            dice2: 1,
        })
        const point20 = makePointRootNode(node, false, 20)
        expect(point20.hasValue).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(20) === 2
        ).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(19) === 3
        ).toBeTruthy()
    })
    test('returns node for point-making(doublet, requires all rolls)', () => {
        const node = boardStateNode(boardState(initialPos), {
            dice1: 1,
            dice2: 1,
        })
        const point21 = makePointRootNode(node, false, 21)
        expect(point21.hasValue).toBeTruthy()
        expect(
            point21.hasValue && point21.board.piecesAt(21) === 2
        ).toBeTruthy()
        expect(
            point21.hasValue && point21.board.piecesAt(19) === 3
        ).toBeTruthy()
    })
    test('returns node for point-making, even though there are other pieces already', () => {
        // 他の駒がすでにある、またはポイントがすでにできている場合でも、makePoint()の返り値自体はtrue
        // 操作上は通常、findMoveの結果のほうを優先するであろうから、
        // 実際にはそこにポイントを作ることはなく、動かすだけになるだろう
        const node = boardStateNode(
            boardState([
                // prettier-ignore
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 5, 2,
                0, 0, 0, 0, 0,
            ]),
            { dice1: 1, dice2: 3 }
        )
        const point20 = makePointRootNode(node, false, 20)
        expect(point20.hasValue).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(19) === 4
        ).toBeTruthy()
        expect(
            point20.hasValue && point20.board.piecesAt(17) === 2
        ).toBeTruthy()

        const point21 = makePointRootNode(node, false, 21)
        expect(point21.hasValue).toBeFalsy()
    })
})

import { boardState } from '../../BoardState'
import { boardStateNode } from '../../BoardStateNode'
import { makePoint } from '../../utils/makePoint'

describe('makePoint', () => {
    test('returns node for point-making', () => {
        const node = boardStateNode(boardState(), { dice1: 3, dice2: 1 })
        const point2 = makePoint(node, 2)
        expect(point2.hasValue).toBeFalsy()
        const point20 = makePoint(node, 20)
        expect(point20.hasValue).toBeTruthy()
        const point21 = makePoint(node, 21)
        expect(point21.hasValue).toBeFalsy()
    })
    test('returns node for point-making(minor roll first)', () => {
        const node = boardStateNode(boardState(), { dice1: 1, dice2: 3 })
        const point2 = makePoint(node, 2)
        expect(point2.hasValue).toBeFalsy()
        const point20 = makePoint(node, 20)
        expect(point20.hasValue).toBeTruthy()
        const point21 = makePoint(node, 21)
        expect(point21.hasValue).toBeFalsy()
    })
    test('requires 2 unused dice', () => {
        const node = boardStateNode(boardState(), {
            dice1: 1,
            dice2: 3,
        }).majorFirst(19)
        if (!node.hasValue) {
            throw Error()
        }
        const point20 = makePoint(node, 20)
        expect(point20.hasValue).toBeFalsy()
        const point21 = makePoint(node, 21)
        expect(point21.hasValue).toBeFalsy()
    })
    test('returns node for point-making(doublet)', () => {
        const node = boardStateNode(boardState(), { dice1: 1, dice2: 1 })
        const point20 = makePoint(node, 20)
        expect(point20.hasValue).toBeTruthy()
    })
    test('returns node for point-making(doublet, requires all rolls)', () => {
        const node = boardStateNode(boardState(), { dice1: 1, dice2: 1 })
        const point21 = makePoint(node, 21)
        expect(point21.hasValue).toBeTruthy()
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
        const point20 = makePoint(node, 20)
        expect(point20.hasValue).toBeTruthy()
        const point21 = makePoint(node, 21)
        expect(point21.hasValue).toBeFalsy()
    })
})

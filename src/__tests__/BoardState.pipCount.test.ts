import { boardState } from '../BoardState'
import { standardConf } from '../GameConfs'

describe('pipCount', () => {
    const board = boardState(standardConf.initialPos)
    test('returns 167 for initialPos', () => {
        expect(board.myPipCount).toBe(167)
        expect(board.opponentPipCount).toBe(167)
    })
    test('returns 167 for opponent', () => {
        expect(board.revert().myPipCount).toBe(167)
        expect(board.opponentPipCount).toBe(167)
    })
    const afterMove = board.movePiece(1, 6).movePiece(1, 4)
    test('decreases as pieces move', () => {
        expect(afterMove.myPipCount).toBe(157)
        expect(afterMove.opponentPipCount).toBe(167)
    })
    test("won't change after revert()", () => {
        expect(afterMove.revert().opponentPipCount).toBe(157)
        expect(afterMove.revert().myPipCount).toBe(167)
    })
    test('increases pips when piece hit', () => {
        const afterHit = afterMove.revert().movePiece(19, 1).movePiece(17, 1)
        expect(afterHit.myPipCount).toBe(165)
        expect(afterHit.opponentPipCount).toBe(195)
    })
})
describe('pipCount for bearOff', () => {
    const board = boardState(
        // prettier-ignore
        [
             0, 
            -1, -1, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
             0,  0, 0, 0, 0, 0,  0, 0, 0, 0, 3, 3, 
             0
        ]
    )
    test('returns valid pip count in bearing-off', () => {
        expect(board.myPipCount).toBe(9)
        expect(board.opponentPipCount).toBe(3)
    })

    const afterMove = board.movePiece(23, 2).movePiece(24, 1)
    test('decreases as pieces move(bearing-off)', () => {
        expect(afterMove.myPipCount).toBe(6)
        expect(afterMove.opponentPipCount).toBe(3)
    })
    test('decreases as pieces move(bearing-off/overrun)', () => {
        const afterBearoff = afterMove.revert().movePiece(23, 6)
        expect(afterBearoff.myPipCount).toBe(1)
        expect(afterBearoff.opponentPipCount).toBe(6)
    })
})

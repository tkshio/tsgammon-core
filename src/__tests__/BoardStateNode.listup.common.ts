import { boardState, BoardState } from '../BoardState'
import { boardStateNode } from '../BoardStateNode'
import { DicePip, diceRoll } from '../Dices'
import { collectMoves } from '../utils/collectMoves'
import { sortMoves, move } from './BoardStateNode.common'

export type Moves = [number, number, boolean?][]
export type listupMovesTest = {
    pos: number[]
    diceRoll: [DicePip, DicePip]
    expectedMoves: Moves[]
    expectedRedundancy?: boolean[]
}

export function listupMovesTest(
    arg: listupMovesTest,
    conf: {
        movesForDoublet?: number
        isEoGFunc?: (board: BoardState) => boolean
    } = {
        movesForDoublet: 4,
        isEoGFunc: (board: BoardState) => board.pieceCount === 0,
    }
) {
    const board = boardState(arg.pos, undefined, undefined, conf.isEoGFunc)
    const node = boardStateNode(
        board,
        diceRoll(arg.diceRoll[0], arg.diceRoll[1]),
        conf.movesForDoublet
    )

    const collected = collectMoves(node).sort((a, b) =>
        sortMoves(a.moves, b.moves)
    )

    expect(collected.map((move) => move.moves)).toEqual(
        arg.expectedMoves.map((moves: Moves) =>
            moves.map(([from, to, isHit]: [number, number, boolean?]) =>
                move(from, to, isHit)
            )
        )
    )

    const isCommitable =
        arg.expectedMoves.length === 1 && arg.expectedMoves[0].length === 0
    expect(node.isCommitable).toBe(isCommitable)
    expect(collected.map((moves) => moves.isRedundant)).toEqual(
        arg.expectedRedundancy
    )
}

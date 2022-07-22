import { boardStateNodeFromArray } from '../BoardStateNode'
import { DicePip } from '../Dices'
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
    conf: { movesForDoublet: number } = { movesForDoublet: 4 }
) {
    const node = boardStateNodeFromArray(
        arg.pos,
        arg.diceRoll[0],
        arg.diceRoll[1],
        undefined,
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

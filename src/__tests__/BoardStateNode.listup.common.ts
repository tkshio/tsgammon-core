import { boardState } from '../BoardState'
import { boardStateNode } from '../BoardStateNodeBuilders'
import { DicePip, diceRoll } from '../Dices'
import { GameConf } from '../GameConf'
import { standardConf } from '../GameConfs'
import { collectMoves } from '../utils/collectMoves'
import { move, sortMoves } from './BoardStateNode.common'

export type Moves = [number, number, boolean?][]
export type listupMovesTest = {
    pos: number[]
    diceRoll: [DicePip, DicePip]
    expectedMoves: Moves[]
    expectedRedundancy?: boolean[]
}

export function listupMovesTest(
    arg: listupMovesTest,
    conf: GameConf = standardConf
) {
    const board = boardState(arg.pos)
    const node = boardStateNode(
        board,
        diceRoll(arg.diceRoll[0], arg.diceRoll[1]),
        conf.transition.ruleSet
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
    expect(node.primary.isCommitable).toBe(isCommitable)
    expect(collected.map((moves) => moves.isRedundant)).toEqual(
        arg.expectedRedundancy
    )
}

import {
    AbsoluteMove,
    makeMoveAbsoluteAsRed,
    makeMoveAbsoluteAsWhite,
} from '../AbsoluteMove'
import { BoardStateNode } from '../BoardStateNode'
import { Dice } from '../Dices'
import { Move } from '../Move'
import { Ply } from '../Ply'

export function toPlyRed(dices: Dice[], node: BoardStateNode): Ply {
    return _toPly(dices, node, makeMoveAbsoluteAsRed, true)
}

export function toPlyWhite(dices: Dice[], node: BoardStateNode): Ply {
    return _toPly(dices, node, makeMoveAbsoluteAsWhite, false)
}

function _toPly(
    dices: Dice[],
    boardStateNode: BoardStateNode, //
    toAbsMove: (move: Move, invertPos: (pos: number) => number) => AbsoluteMove, //
    isRed: boolean
): Ply {
    return {
        moves: boardStateNode.lastMoves.map((m) =>
            toAbsMove(m, boardStateNode.board.invertPos)
        ),
        dices: dices.map((dice) => dice.pip),
        isRed: isRed,
    }
}

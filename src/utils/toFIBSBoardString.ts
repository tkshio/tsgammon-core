import { boardState, BoardState } from '../BoardState'
import { BoardStateNode, nodeWithEmptyDice } from '../BoardStateNode'
import { cube, CubeState } from '../CubeState'
import { DicePip, DiceRoll } from '../Dices'

import {
    FIBSBoard,
    initBoard,
    TURN,
    encodeFIBSBoardString,
    COLOUR,
    DIRECTION,
} from './FIBSBoardString'

/**
 * BoardState/BoardStateNode/number[]で表された状況を、FIBS Clientの仕様で
 * 文字列（FIBS形式）に変換する
 *
 * http://www.fibs.com/fibs_interface.html#board_state
 *
 * ※ omitUnusedDiceを指定すると、使えないダイスは文字列に含めなくなる。
 * 1つだけ駒を動かした状態を表現するのに使用しているが、通常は必要なく、
 * 上記の仕様に合致しているかも不明瞭。
 *
 * @param arg 変換対象
 * @param opt.colour 自分の駒をOにするかX（既定値）にするか
 * @param opt.direction 自分の動かす向きを1->24と24->1（既定値）のどちらでエンコードするか
 * @param opt.turn 手番はOかXか（省略時は自分=colourと同じ）
 * @param opt.omitUnusedDice 使えないダイスロールを含めない
 * @returns FIBS形式の文字列
 */
export function toFIBSBoard(
    arg: number[] | BoardState | BoardStateNode,
    opt: {
        colour?: COLOUR
        direction?: DIRECTION
        turn?: TURN
        omitUnusedDice?: boolean
    } = {}
): string {
    const boardOrNode = Array.isArray(arg) ? boardState(arg) : arg

    const flagged: BoardStateNode | (BoardState & { hasValue: false }) = {
        hasValue: false,
        ...boardOrNode,
    }
    const node = flagged.hasValue ? flagged : nodeWithEmptyDice(flagged)

    return encodeFIBSBoardString(boardStateToFIBSBoard(node, opt, undefined))
}

function boardStateToFIBSBoard(
    node: BoardStateNode,
    opt: {
        colour?: COLOUR
        direction?: DIRECTION
        turn?: TURN
        omitUnusedDice?: boolean
    },
    cubeState: CubeState = cube(1)
): FIBSBoard {
    const {
        colour = COLOUR.X,
        direction = DIRECTION.DESC,
        omitUnusedDice = false,
    } = opt

    const board = node.board
    const dices = omitUnusedDice
        ? node.dices.filter((dice) => !dice.used)
        : node.dices

    const diceRoll: DiceRoll | { dice1: DicePip | 0; dice2: 0 } =
        dices.length >= 2
            ? { dice1: dices[0].pip, dice2: dices[1].pip }
            : dices.length === 1
            ? { dice1: dices[0].pip, dice2: 0 }
            : { dice1: 0, dice2: 0 }
    const canMove = node.hasValue
        ? node.dices.filter((dice) => !dice.used).length - node.lastMoves.length
        : 0

    const posArr =
        colour === COLOUR.O ? board.points() : board.points().map((p) => -p)

    // 手番はデフォルトでは自分（COLOURで決まる）で、指定があればそれを優先
    const { turn = colour === COLOUR.O ? TURN.O : TURN.X } = opt
    const pos =
        direction === DIRECTION.ASC
            ? posArr
            : posArr.map((_, i, arr) => posArr[arr.length - 1 - i])
    const playerOnHome = board.myBornOff()
    const opponentOnHome = board.opponentBornOff()
    const { home, bar } =
        direction === DIRECTION.ASC
            ? { home: 25, bar: 0 }
            : { home: 0, bar: 25 }

    return initBoard({
        turn,
        pos,
        ...diceRoll,
        playerOnHome,
        opponentOnHome,
        cube: cubeState.value,
        colour,
        direction,
        home,
        bar,
        canMove,
    })
}

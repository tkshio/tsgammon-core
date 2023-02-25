import { boardState, BoardState } from '../BoardState'
import { BoardStateNode } from '../BoardStateNode'
import { Dice, DiceRoll0 } from '../Dices'
import { FIBSCube } from './FIBSCube'

import { nodeWithEmptyDice } from '../BoardStateNodeBuilders'
import {
    COLOUR,
    DIRECTION,
    encodeFIBSBoardString,
    FIBSBoard,
    initBoard,
    TURN,
} from './FIBSBoard'
import { FIBSScore } from './FIBSState'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'

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
    arg: {
        board: number[] | BoardState | BoardStateNode | BoardStateNodeRoot
        cube?: FIBSCube
        player?: string
        opponent?: string
        matchScore?: FIBSScore
    },
    opt: {
        colour?: COLOUR
        direction?: DIRECTION
        turn?: TURN
        omitUnusedDice?: boolean
    } = {}
): string {
    function toNode(
        board: BoardState | BoardStateNode | BoardStateNodeRoot
    ): BoardStateNode {
        const labeled:
            | ({ isRoot: false; hasValue: false } & BoardState)
            | ({ isRoot: false } & BoardStateNode)
            | BoardStateNodeRoot = {
            isRoot: false,
            hasValue: false,
            ...board,
        }
        return labeled.isRoot
            ? { ...labeled.root, dices: labeled.dices }
            : labeled.hasValue
            ? labeled
            : nodeWithEmptyDice(labeled)
    }
    const node = Array.isArray(arg.board)
        ? nodeWithEmptyDice(boardState(arg.board))
        : toNode(arg.board)
    const cube = {
        cubeValue: 1,
        playerMayDouble: true,
        opponentMayDouble: true,
        ...arg.cube,
    }
    const matchScore = {
        matchLen: 9999,
        playerScore: 0,
        opponentScore: 0,
        ...arg.matchScore,
    }
    return encodeFIBSBoardString(
        boardStateToFIBSBoard(node, cube, matchScore, opt)
    )
}

function boardStateToFIBSBoard(
    node: BoardStateNode,
    cube: FIBSCube,
    matchScore: FIBSScore,
    opt: {
        player?: string
        opponent?: string
        colour?: COLOUR
        direction?: DIRECTION
        turn?: TURN
        omitUnusedDice?: boolean
    }
): FIBSBoard {
    const {
        player = 'You',
        opponent = 'opponent',
        colour = COLOUR.X,
        direction = DIRECTION.DESC,
        omitUnusedDice = false,
    } = opt

    const board = node.board
    const dices = omitUnusedDice
        ? omitUnused(node.dices.filter((dice) => !dice.used))
        : { dice1: node.dices[0]?.pip ?? 0, dice2: node.dices[1]?.pip ?? 0 }
    function omitUnused(dices: Dice[]): DiceRoll0 {
        return dices.length >= 2
            ? { dice1: dices[0].pip, dice2: dices[1].pip }
            : dices.length === 1
            ? { dice1: dices[0].pip, dice2: 0 }
            : { dice1: 0, dice2: 0 }
    }

    const canMove = node.hasValue
        ? node.dices.filter((dice) => !dice.used).length
        : 0

    const posArr =
        colour === COLOUR.O ? board.points : board.points.map((p) => -p)

    // 手番はデフォルトでは自分（COLOURで決まる）で、指定があればそれを優先
    const { turn = colour === COLOUR.O ? TURN.O : TURN.X } = opt
    const pos =
        direction === DIRECTION.ASC
            ? posArr
            : posArr.map((_, i, arr) => posArr[arr.length - 1 - i])
    const playerOnHome = board.myBornOff
    const opponentOnHome = board.opponentBornOff
    const { home, bar } =
        direction === DIRECTION.ASC
            ? { home: 25, bar: 0 }
            : { home: 0, bar: 25 }

    return initBoard({
        player,
        opponent,
        turn,
        pos,
        ...dices,
        playerOnHome,
        opponentOnHome,
        ...cube,
        ...matchScore,
        colour,
        direction,
        home,
        bar,
        canMove,
    })
}

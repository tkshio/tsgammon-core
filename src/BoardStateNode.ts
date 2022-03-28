import { BoardState, boardState } from "./BoardState";
import { buildNodesForDoublet } from "./internals/buildNodesForDoublet";
import { buildNodesForHeteroDice } from "./internals/buildNodesForHeteroDice";
import { Dice, DiceRoll, DicePip } from "./Dices";
import { Move } from "./Move";

/**
 * 駒の配置とダイスの使用状況を保持し、あわせて遷移可能な局面をツリー構造で表現するオブジェクト。
 * 
 * あるポイントから駒を1つ動かした局面が子局面で、各ポイントから紐付けられた形で子ノードになる。
 *
 * ダイスの使う順序によって子局面は異なるので、majorFirst/minorFirstに分けて格納されている。
 */
export type BoardStateNode = {
    /** 有効な局面である、すなわちこのオブジェクトがNO_MOVEではないことを示す */
    hasValue: true,
    /** ダイスの目と使用状況を示す */
    dices: Dice[]

    /** 駒の配置を示す */
    board: BoardState

    /**
     * 指定されたポイントに大きいほうの目を適用した後の局面を返す。
     * 
     * 適用できない、またはposが範囲外の場合、NoMoveが返る。
     * 
     * @param pos 目を適用したいポイント
     */
    majorFirst: (pos: number) => (BoardStateNode | NoMove)

    /**
     * 指定されたポイントに小さいほうの目を適用した後の状態を返す。
     * 
     * 適用できない、またはposが範囲外の場合、NoMoveが返る。
     * @param pos 目を適用したいポイント
     */
    minorFirst: (pos: number) => (BoardStateNode | NoMove)

    /**
     * この局面にいたる直前までに適用した手。ロール直後の場合は空となる。
     */
    lastMoves(): Move[]

    /** 
     * 冗長なノードを示す：ツリー端のノードで、同一局面でisRedundant=falseなノードが既に存在している場合true */
    isRedundant: boolean;

    /** コミット可能（これ以上手がない）ならtrue */
    isCommitable: boolean
}

/**
 * {@link BoardStateNode.majorFirst()} / {@link minorFirst()}に対して、
 * 該当がないことを示す
 */
export type NoMove = { hasValue: false }

/**
 * NoMove型のインスタンス
 */
export const NO_MOVE: NoMove = { hasValue: false }



/**
 * 与えられたBoardStateオブジェクトとダイスから、BoardStateNodeを生成する
 */
export function boardStateNode(board: BoardState, dicePips: DiceRoll): BoardStateNode {
    const { dice1, dice2 } = dicePips

    return (dice1 !== dice2) ?
        buildNodesForHeteroDice(board, dice1, dice2) :
        buildNodesForDoublet(board, dice1)
}

/**
 * 各ポイントの駒数を格納した配列からBoardStateNodeを生成する
 */
export function boardStateNodeFromArray(pieces: number[],
    dice1: DicePip, dice2: DicePip,
    bornOffs: [number, number] = [0, 0]): BoardStateNode {

    const board = boardState(pieces, bornOffs)
    return boardStateNode(board, { dice1, dice2 })
}

// ダイスを無視して何も次の手がない状態のBoardStateNodeを生成する
function emptyNode(board: BoardState, dices: Dice[]): BoardStateNode {
    return {
        hasValue: true,
        dices,
        board,
        majorFirst: () => NO_MOVE,
        minorFirst: () => NO_MOVE,
        lastMoves: () => [],
        isRedundant: false,
        isCommitable: true
    }
}

/**
 * 与えられた局面に対し、ダイスなし、可能な手なしのBoardStateNodeを生成する
 * @param board
 */
export function nodeWithEmptyDice(board: BoardState): BoardStateNode {
    return emptyNode(board, [])
}


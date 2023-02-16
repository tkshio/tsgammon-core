import { BoardState } from './BoardState'
import { Dice } from './Dices'
import { EOGStatus } from './EOGStatus'
import { Move } from './Move'

/**
 * 駒の配置とダイスの使用状況を保持し、あわせて遷移可能な局面をツリー構造で表現するオブジェクト。
 *
 * あるポイントから駒を1つ動かした局面が子局面で、各ポイントから紐付けられた形で子ノードになる。
 *
 * ダイスの使う順序によって子局面は異なるので、majorFirst/minorFirstに分けて格納されている。
 */
export type BoardStateNode = {
    /** 有効な局面である、すなわちこのオブジェクトがNO_MOVEではないことを示す */
    hasValue: true
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
    childNode: (pos: number) => BoardStateNode | NoMove

    /**
     * この局面にいたる直前までに適用した手。ロール直後の場合は空となる。
     */
    lastMoves: Move[]

    /**
     * 冗長なノードを示す：ツリー端のノードで、同一局面でisRedundant=falseなノードが既に存在している場合true */
    isRedundant: boolean

    /** コミット可能（これ以上手がない）ならtrue */
    isCommitable: boolean

    /** 終局状態 */
    eogStatus: EOGStatus

    /** BoardStateNodeRootとの区別のため */
    isRoot: false
}

/**
 * {@link BoardStateNode["majorFirst"]} / {@link BoardStateNode["minorFirst"]}に対して、
 * 該当がないことを示す
 */
export type NoMove = { hasValue: false }

/**
 * NoMove型のインスタンス
 */
export const NO_MOVE: NoMove = { hasValue: false }

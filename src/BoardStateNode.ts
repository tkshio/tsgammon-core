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

/**
 * BoardStateNodeが保持する、適用可能な手を表したツリーに対して、
 * 任意のノードを選択する関数を順次受け付けるためのラッパー
 */
export type Wrapped<T extends { hasValue: boolean }> = {
    /**
     * wrap()に渡した値、または直前のapply()/or()がhasValue=trueを満たすなら、指定された関数fを適用する。
     */
    apply: (f: (a: T) => T | { hasValue: false }) => Wrapped<T>
    /**
     * wrap()に渡した値、または直前のapply()/or()がhasValue=falseの場合のみ、指定された関数fを適用する
     */
    or: (f: (a: T) => T | { hasValue: false }) => Wrapped<T>
    /**
     * 現時点で選択されたノード（または該当なし）を返す
     */
    unwrap: T | { hasValue: false }
}
/**
 * 指定されたノードをWrapperに変換する
 * @param t Wrapperにしたいノード
 * @returns
 */
export function wrap<T extends { hasValue: true }>(
    t: T | { hasValue: false }
): Wrapped<T> {
    return _wrap(t, { hasValue: false })
}

function _wrap<T extends { hasValue: true }>(
    t: T | { hasValue: false }, // 直前のor/applyで引数の関数で見つかったノード
    was: T | { hasValue: false } // or/applyの関数に、引数として渡されたノード
): Wrapped<T> {
    return {
        apply: (f: (arg: T) => T | { hasValue: false }) =>
            _wrap(t.hasValue ? f(t) : t, t),
        or: (f: (arg: T) => T | { hasValue: false }) =>
            _wrap(t.hasValue ? t : was.hasValue ? f(was) : was, was),
        unwrap: t,
    }
}

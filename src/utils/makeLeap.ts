import { BoardStateNode, NoMove, NO_MOVE, wrap } from '../BoardStateNode'
import { findMove } from './findMove'

/**
 * 与えられたBoardStateNodeについて、指定された位置へ駒を動かすムーブがあれば、それを返す
 * @param node
 * @param pos
 * @param useMinorFirst
 * @returns
 */
export function makeLeap(
    node: BoardStateNode,
    pos: number,
    useMinorFirst: boolean
): BoardStateNode | NoMove {
    const dices = node.dices.filter((d) => !d.used)
    if (dices.length == 0) {
        return NO_MOVE
    }
    // まず、一つだけですむケースを探す
    const { major, minor } =
        dices.length >= 2
            ? dices[0].pip > dices[1].pip
                ? { major: dices[0].pip, minor: dices[1].pip }
                : { major: dices[1].pip, minor: dices[0].pip }
            : { major: dices[0].pip, minor: undefined }
    const withMajor =
        pos - major >= 0 ? findMove(node, pos - major, false) : NO_MOVE
    // 本来はここでもuseMinorFirstを意識しないといけないが、この関数はmakePointの後で
    // 使用する想定なので、major/minorの両方で駒が動かせる時は、そちらで拾われることになり
    // 意識する意味がない
    if (
        withMajor.hasValue &&
        withMajor.lastMoves[withMajor.lastMoves.length - 1].to === pos
    ) {
        return withMajor
    }

    if (minor === undefined) {
        return NO_MOVE
    }

    const withMinor =
        pos - minor >= 0 ? findMove(node, pos - minor, true) : NO_MOVE
    if (
        withMinor.hasValue &&
        withMinor.lastMoves[withMinor.lastMoves.length - 1].to === pos
    ) {
        return withMinor
    }
    // 二つ使う場合は、useMinorFirstを反映させる
    const from = pos - (major + minor)
    const leap = wrap(node)
        .apply((node) => findMove(node, from, useMinorFirst))
        .apply((node) => makeLeap(node, pos, useMinorFirst)).unwrap
    if (leap.hasValue) {
        return leap
    }
    // ゾロ目でないなら、これ以上のサーチは不要
    if (dices.length < 3) {
        return NO_MOVE
    }

    // 残りのダイス（全て同じ目とする）が使えるかどうかは再帰して判定する
    return (
        wrap(node)
            // 一つ前のポイントをクリックした状態を生成
            .apply((node) =>
                pos - major >= 0
                    ? makeLeap(node, pos - major, useMinorFirst)
                    : NO_MOVE
            )
            // 一つ前のポイントにきた駒をクリックして進めた状態を生成
            .apply((node) => findMove(node, pos - major, useMinorFirst)).unwrap
    )
}

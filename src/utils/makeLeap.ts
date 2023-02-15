import { BoardStateNode, NoMove, NO_MOVE, wrap } from '../BoardStateNode'

/**
 * 与えられたBoardStateNodeについて、指定された位置へ駒を動かすムーブがあれば、それを返す
 * @param node
 * @param pos
 * @param useMinorFirst
 * @returns
 */
export function makeLeap(
    node: BoardStateNode,
    pos: number
): BoardStateNode | NoMove {
    const dices = node.dices.filter((d) => !d.used)
    if (dices.length == 0) {
        return NO_MOVE
    }
    // まず、一つだけですむケースを探す
    const dice0 = dices[0].pip
    const withMajor = pos - dice0 >= 0 ? node.majorFirst(pos - dice0) : NO_MOVE
    if (
        withMajor.hasValue &&
        withMajor.lastMoves[withMajor.lastMoves.length - 1].to === pos
    ) {
        return withMajor
    }
    // 使えるダイスが一つしかないなら該当なしを返す
    if (dices.length < 2) {
        return NO_MOVE
    }
    const dice1 = dices[1].pip

    const from = pos - (dice0 + dice1)
    const leap = wrap(node)
        .apply((node) => node.majorFirst(from))
        .apply((node) => makeLeap(node, pos)).unwrap
    if (leap.hasValue) {
        return leap
    }
    // ゾロ目でないなら、これ以上のサーチは不要
    if (dices.length < 3) {
        return NO_MOVE
    }

    // 残りのダイス（全て同じ目とする）が使えるかどうかは再帰して判定する
    return (
        // 既にダイスを2個使うケースは確認したので、2個進めた状態から再帰
        wrap(node)
            .apply((node) =>
                pos - dice0 >= 0 ? makeLeap(node, pos - dice0) : NO_MOVE
            )
            .apply((node) => node.majorFirst(pos - dice0)).unwrap
    )
}

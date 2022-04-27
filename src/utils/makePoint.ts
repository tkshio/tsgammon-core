import { BoardStateNode, NoMove, NO_MOVE } from '../BoardStateNode'
import { findMove } from './findMove'
/**
 * 指定された局面について、指定のポイントにブロックを築けるかどうかを返す
 *
 * @param node 対象となる局面
 * @param pos ブロックを作ろうとしているポイント
 * @returns ポイントを作った後の局面、またはNOMOVE
 */
export function makePoint(
    node: BoardStateNode,
    pos: number
): BoardStateNode | NoMove {
    const dices = node.dices.filter((d) => !d.used)
    if (dices.length < 2) {
        return NO_MOVE
    }
    const { major, minor } =
        dices[0].pip > dices[1].pip
            ? { major: dices[0].pip, minor: dices[1].pip }
            : { major: dices[1].pip, minor: dices[0].pip }

    if (pos < major) {
        return NO_MOVE
    }

    // 未使用のダイス2つで指定されたポイントが作れるなら、それを返す
    const nodeMakePoint = wrap(node)
        .apply(moveFinder(pos - major))
        .apply(moveFinder(pos - minor)).unwrap

    if (nodeMakePoint.hasValue) {
        return nodeMakePoint
    }

    // ゾロ目の場合は、中間地点に作ってからそれを動かせるかを調べる
    if (dices.length === 4 && major === minor) {
        return wrap(node)
            .apply(pointMaker(pos - major))
            .apply(pointMaker(pos)).unwrap
    }

    return NO_MOVE
}

// apply(func)の形で記述するためのユーティリティ

type Wrapped<T extends { hasValue: boolean }> = {
    apply: (f: (a: T) => T | { hasValue: false }) => Wrapped<T>
    unwrap: T | { hasValue: false }
}

function wrap<T extends { hasValue: true }>(
    t: T | { hasValue: false }
): Wrapped<T> {
    return {
        apply: (f: (arg: T) => T | { hasValue: false }) =>
            wrap(t.hasValue ? f(t) : t),
        unwrap: t,
    }
}

function moveFinder(
    pos: number
): (node: BoardStateNode) => BoardStateNode | NoMove {
    return (node: BoardStateNode) => findMove(node, pos, false)
}

function pointMaker(
    pos: number
): (node: BoardStateNode) => BoardStateNode | NoMove {
    return (node: BoardStateNode) => makePoint(node, pos)
}

import { BoardStateNode, NoMove } from '../BoardStateNode'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'

/**
 * ある局面について、指定された位置で指定の目が適用できるかどうかを判定する
 *
 * @param node 局面
 * @param pos 目を適用したい位置
 * @param useMinorFirst 小さい目を優先して使用する場合はtrue
 * @returns 適用後の状態を表す子局面、またはNoMove
 */

export function findMove(
    node: BoardStateNode | BoardStateNodeRoot,
    pos: number,
    useMinorFirst = false
): BoardStateNode | NoMove {
    const target = node.isRoot
        ? useMinorFirst && node.alternate
            ? node.alternate
            : node.primary
        : node
    return target.childNode(pos)
}

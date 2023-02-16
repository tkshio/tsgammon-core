import { BoardStateNode } from '../BoardStateNode'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'

/**
 * 指定された局面について、冗長な手も含めて、手番終了時の局面を全て格納した配列を返す。
 *
 * 可能な手がない場合は、指定された局面だけがそのまま格納された配列が返る。
 * @param node 局面
 */
export function collectNodes(
    node: BoardStateNode | BoardStateNodeRoot
): BoardStateNode[] {
    return node.isRoot ? collectNodesRootNode(node) : _collectNodes(node)
}

function _collectNodes(node: BoardStateNode): BoardStateNode[] {
    const hasUnusedDice = node.dices.find((dice) => !dice.used)
    if (hasUnusedDice) {
        return node.board.points
            .map((_, idx) => node.childNode(idx))
            .map((node) => (node.hasValue ? collectNodes(node) : []))
            .flat()
    }
    return [node] // 末端に達したので、自分自身を返す
}

function collectNodesRootNode(node: BoardStateNodeRoot): BoardStateNode[] {
    const major: BoardStateNode[] = _collectNodes(node.root)
    const swapped = node.swapped
    if (swapped) {
        const minor = _collectNodes(swapped)
        return minor.concat(major)
    }
    return major
}

import { BoardStateNode } from '../BoardStateNode'

/**
 * 指定された局面について、冗長な手も含めて、手番終了時の局面を全て格納した配列を返す。
 *
 * 可能な手がない場合は、指定された局面だけがそのまま格納された配列が返る。
 * @param node 局面
 */

export function collectNodes(node: BoardStateNode): BoardStateNode[] {
    const hasUnusedDice = node.dices.find((dice) => !dice.used)
    if (hasUnusedDice) {
        const major: BoardStateNode[] = node.board.points
            .map((_, idx) => node.majorFirst(idx))
            .map((node) => (node.hasValue ? collectNodes(node) : []))
            .flat()
        const minor: BoardStateNode[] = node.board.points
            .map((_, idx) => node.minorFirst(idx))
            .map((node) => (node.hasValue ? collectNodes(node) : []))
            .flat()

        return minor.concat(major)
    }
    return [node]
}

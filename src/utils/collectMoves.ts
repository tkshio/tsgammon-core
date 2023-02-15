import { RootBoardStateNode } from '../RootBoardStateNode'
import { Move } from '../Move'
import { collectNodes } from './collectNodes'

/**
 * 指定された局面について、冗長な手も含めて、可能な手を全て格納した配列を返す
 * @param node 局面
 */

export function collectMoves(node: RootBoardStateNode): Moves[] {
    const nodes = collectNodes(node)
    return nodes.map((n) => ({
        moves: n.lastMoves,
        isRedundant: n.isRedundant,
    }))
}

/**
 * ある局面について、ロールを使い切る手を表す
 */
export type Moves = {
    /** 指し手を表す配列 */
    moves: Move[]
    /** 指し手を適用した後に同じ結果になる手が他に存在するなら、true */
    isRedundant: boolean
}

import { BoardStateNode, NoMove } from '../BoardStateNode'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'
import { wrapNode } from './wrapNode'

/**
 * 指定のポイントから駒を動かせる場合、動かした後の局面を返す
 * 現在はReadmeの説明のためにしか使用していない
 *
 * @param node 現局面
 * @param pos このポイントにある駒を動かす
 * @param doSwap 後にロールしたダイスの目を使いたい時、true
 * @returns
 */
export function findMove(
    node: BoardStateNode | BoardStateNodeRoot,
    pos: number,
    doSwap: boolean
): BoardStateNode | NoMove {
    return wrapNode(node, doSwap) //
        .apply((node) => node.childNode(pos)).unwrap
}

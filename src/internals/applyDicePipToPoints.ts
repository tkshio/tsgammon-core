import { BoardState } from '../BoardState'
import { DicePip } from '../Dices'
import { BoardStateNode, NoMove, NO_MOVE } from '../BoardStateNode'
import { isLegalMove } from './isLegalMove'
import { NodeBuilder } from './NodeBuilder'

/**
 * 指定された盤面について、指定された目を各ポイントに適用し、それぞれの場合の子局面を生成する。
 *
 * 生成された子局面は、ポイント位置に対して子局面を返す関数として返される。
 *
 * @param board 盤面
 * @param dicePip 盤面に対して使用したいダイス目
 * @param lastMoves この局面に至るまでに適用したムーブ
 * @param nodeBuilder ダイスが適用可能なポイントについて、適用後の状態を表す子局面ノードを生成する関数
 * @param mark この局面での未使用のダイスの数
 * @returns 各ポイントへのダイス適用可否（可の場合は{@link BoardStateNode}、否の場合は{@link NoMove}）を返す関数と、使用できなかったダイスの数（必ずmark以下の値となる）が返る
 *
 * 返値の未使用のダイスの数は、この局面で全くダイスが適用できない場合はmarkのままとなり、そうでなければ、
 * 子局面全体でできるだけ多くダイスを使った場合の、残りのダイス数となる。
 *
 */
export function applyDicePipToPoints(
    board: BoardState,
    dicePip: DicePip,
    nodeBuilder: NodeBuilder,
    mark: number
): [(pos: number) => BoardStateNode | NoMove, number] {
    // すでに終局となっているのならば、子局面は生成しない
    if (board.eogStatus().isEndOfGame) {
        return [() => NO_MOVE, mark]
    }

    // 各ポイントについて、そこの駒を動かす手が有効なら、nodeBuilderを呼んで子局面を生成する
    const nodesAndMarksForEachPoint: [BoardStateNode | NoMove, number][] = board
        .points()
        .map((_, index) => {
            // 各ポイントについて、指定のダイス目が使えるかどうか判断する
            const move = isLegalMove(board, index, dicePip)

            // 使えるポイントについては子ノードを生成し、そうでなければNO_MOVEを返す
            return move.isLegal
                ? nodeBuilder(board.movePiece(index, dicePip), move.move)
                : [NO_MOVE, mark]
        })

    // 使用不能なダイスの数については、最小値をとる
    const markedMin = nodesAndMarksForEachPoint
        .map(([, mark]) => mark)
        .reduce((m1, m2) => Math.min(m1, m2))

    // 最大限ダイスを使える手に絞り込む
    const nodes = nodesAndMarksForEachPoint.map(([node, marked]) => {
        return marked === markedMin ? node : NO_MOVE
    })

    return [(pos) => nodes[pos] ?? NO_MOVE, markedMin]
}

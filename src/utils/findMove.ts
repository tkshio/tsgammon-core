import { BoardStateNode, NoMove } from "../BoardStateNode";

/**
 * ある局面について、指定された位置で指定の目が適用できるかどうかを判定する
 *
 * @param node 局面
 * @param pos 目を適用したい位置
 * @param useMinorFirst 小さい目を優先して使用する場合はtrue
 * @returns 適用後の状態を表す子局面、またはNoMove
 */

export function findMove(node: BoardStateNode, pos: number, useMinorFirst: boolean): BoardStateNode | NoMove {

    // すでに作成済みの候補リストから、該当するムーブ（の適用後の局面）を探す
    const nodesAfterMove = useMinorFirst ?
        (node.minorFirst(pos).hasValue ?
            node.minorFirst(pos) : node.majorFirst(pos)) :
        (node.majorFirst(pos).hasValue ?
            node.majorFirst(pos) : node.minorFirst(pos));
    return nodesAfterMove;
}

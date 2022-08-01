import { AbsoluteBoardState } from '../AbsoluteBoardState'
import { BoardState } from '../BoardState'
import { BoardStateNode } from '../BoardStateNode'
import { Ply } from '../Ply'
import { SGInPlay } from './SingleGameState'

/**
 * チェッカープレイが未確定の状態を表す
 */
export type CheckerPlayState = {
    isCommitted: false

    curPly: Ply
    curBoardState: BoardStateNode
    absBoard: AbsoluteBoardState
    isUndoable: boolean
    boardStateNodeRevertTo: BoardStateNode
    absBoardRevertTo: AbsoluteBoardState
    toAbsBoard: (board: BoardState) => AbsoluteBoardState
    toPly: (board: BoardStateNode) => Ply
    toPos: (n: number) => number
    revertDicesFlag: boolean
}

/**
 * チェッカープレイが確定した状態を表す
 */
export type CheckerPlayStateCommitted = {
    isCommitted: true
    boardStateNode: BoardStateNode
}

/**
 * チェッカープレイ開始状態を示すSGStateオブジェクトを、CheckerPlayStateオブジェクトに変換する
 * @param sgInPlay
 * @returns
 */
export function asCheckerPlayState(sgInPlay: SGInPlay): CheckerPlayState {
    const { boardStateNode, absBoard, revertTo, toAbsBoard, toPly, toPos } =
        sgInPlay
    const curPly = toPly(boardStateNode)
    const isUndoable = curPly.moves.length > 0
    return {
        isCommitted: false,

        curPly,
        curBoardState: boardStateNode,
        absBoard,
        boardStateNodeRevertTo: revertTo,
        absBoardRevertTo: toAbsBoard(revertTo.board),

        toAbsBoard,
        toPly,
        toPos,

        isUndoable,
        revertDicesFlag: false,
    }
}

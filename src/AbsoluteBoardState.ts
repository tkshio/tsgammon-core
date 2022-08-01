import { boardState, BoardState } from './BoardState'
import { standardConf } from './GameConf'

/**
 * 盤面を絶対座標で表現した、主に表示用のインターフェース
 * ポイントの座標は、Whiteのスタートが0で表記される（MoveFormatDirection.ABSOLUTE）
 */
export interface AbsoluteBoardState {
    /**
     * 各ポイントの駒数を格納した配列を返す
     */
    points(): number[]

    /**
     * 指定されたポイントの駒数を返す。正はWhiteの、負はRedの駒数を示す
     * @param n
     */
    piecesAt(n: number): number

    /**
     * すでに上がったWhiteの駒の数を返す。
     */
    whiteBornOff(): number

    /**
     * すでに上がったRedの駒の数を返す（負数ではなく、正の値を返すことに注意）。
     */
    redBornOff(): number
}

/**
 * 絶対表記の盤面状態を生成する
 * @param pieces 駒の配置を表す配列
 * @param bornOffs すでに上げた駒の数の配列:bornOffs[0]は赤、[1]は白（省略時はいずれも0）
 * @returns
 */
export function initAbsoluteBoard(
    pieces: number[] = standardConf.initialPos,
    bornOffs: [number, number] = [0, 0]
): AbsoluteBoardState {
    const board = boardState(pieces, bornOffs)
    return whiteViewAbsoluteBoard(board)
}

/**
 * 相対表記であるBoardStateを、Whiteの観点で絶対表記に変換する。
 * 実質的にはそのまま返す
 * @param boardState
 */
export function whiteViewAbsoluteBoard(
    boardState: BoardState
): AbsoluteBoardState {
    return {
        points: () => boardState.points,
        piecesAt: (n) => boardState.piecesAt(n),
        whiteBornOff: () => boardState.myBornOff,
        redBornOff: () => boardState.opponentBornOff,
    }
}

/**
 * 相対表記であるBoardStateを、Redの観点で絶対表記に変換する。
 * 実質的には座標を反転、駒数も正負反転させて返す
 * @param boardState
 */
export function redViewAbsoluteBoard(
    boardState: BoardState
): AbsoluteBoardState {
    const boardSize = boardState.points.length - 1
    return {
        points: () =>
            boardState.points
                .slice()
                .reverse()
                .map((v) => (v === 0 ? v : -v)),
        piecesAt: (n) => -boardState.piecesAt(boardSize - n),
        whiteBornOff: () => boardState.opponentBornOff,
        redBornOff: () => boardState.myBornOff,
    }
}

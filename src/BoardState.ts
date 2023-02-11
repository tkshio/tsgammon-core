import { DicePip } from './Dices'

/**
 * 相対表記で表現した盤面。常に動かす側の観点になっていて、0はバーポイント、25は上がり、
 * 正の数が自分の駒数となっている。内部的な盤の操作はすべてこのインターフェースを介して行い、
 * 外部へ表示する際にはAbsoluteBoardで変換する
 */
export type BoardState = {
    /** 各ポイントの駒数を格納した配列。正の数は自駒、負の数は相手駒 */
    points: number[]

    /** 最後尾の駒の位置 */
    lastPiecePos: number

    /** 相手の最後尾の駒の位置 */
    opponentLastPiecePos: number

    /** ベアリングオフの行き先となる位置（標準は25） */
    bearOffPos: number

    /** 指定の位置を相手側の視点で見た時の位置に変換する（e.g. 1=>24, 6=>18, ...）*/
    invertPos(pos: number): number

    /** ベアリングオフできるならtrue */
    isBearable: boolean

    /** 各ポイントの駒数を返す。正の数は自駒、負の数は相手駒 */
    piecesAt(n: number): number

    /** ベアリングオフ済みの自駒数を返す */
    myBornOff: number

    /** ベアリングオフ済みの相手駒数を返す */
    opponentBornOff: number

    /** 指定されたポイントの駒をpip分進めた盤面を返す。
     * ポイントに駒がなかったり、行き先がブロックされている・範囲外などの場合、自分自身が返ってくる */
    movePiece(from: number, pip: DicePip): BoardState

    /** 盤面を相手側視点に変換する */
    revert(): BoardState

    /**
     * 自分のピップカウント
     */
    myPipCount: number

    /**
     * 相手のピップカウント
     */
    opponentPipCount: number

    /**
     * ランニングゲーム（駒同士のコンタクトがない）状態ならtrue
     */
    isRunningGame: boolean

    /**
     * 自分のまだ上がっていない駒の数
     */
    pieceCount: number

    /**
     * 相手のまだ上がっていない駒の数
     */
    opponentPieceCount: number

    /**
     * 自分のインナーボードの開始点（標準ルールでは19）
     */
    innerPos: number
}

/**
 * BoardStateの実装に必要な機能で、外部には公開する必要がないものの定義
 */
type Board = {
    // all gone
} & BoardState

function countWhitePieces(pieces: number[]) {
    return pieces.filter((n) => n > 0).reduce((n, m) => n + m, 0)
}

function countRedPieces(pieces: number[]) {
    return countWhitePieces(pieces.map((n) => -n))
}

/**
 * 駒の配置を格納した配列から、BoardStateを生成する
 *
 * @param pieces 駒の配置（省略時は標準ルールでの開始時な配置）
 * @param bornOffs すでにベアリングオフした駒の数の対（順に自分、相手：省略時は0）
 * @param innerPos この値とそれ以降がインナーボードとなる
 * @param eogStatus 終局状態
 * @returns 盤面
 */
export function boardState(
    pieces: number[],
    bornOffs: [number, number] = [0, 0],
    innerPos = 19
): BoardState {
    return initBoardState(pieces, bornOffs, innerPos)
}

function posInverterFor(points: number[]): (pos: number) => number {
    return (pos: number) => points.length - 1 - pos
}

function initBoardState(
    points: number[],
    bornOffs: [number, number] = [0, 0],
    innerPos: number
): BoardState {
    const myBornOff = bornOffs[0]
    const opponentBornOff = bornOffs[1]
    const pieceCount = countWhitePieces(points)
    const opponentPieceCount = countRedPieces(points)
    const bearOffPos = points.length - 1

    const reverted = revertPoints(points)
    const invertPos = posInverterFor(points)

    const lastPiecePos = points.findIndex((n) => 0 < n)
    const found = reverted.findIndex((n) => 0 < n)
    const opponentLastPiecePos = found === -1 ? 0 : invertPos(found)

    const isBearable = innerPos <= lastPiecePos

    const myPipCount = countPip(points)
    const opponentPipCount = countPip(reverted)
    const isRunningGame = lastPiecePos < opponentLastPiecePos
    const board: BoardState = {
        points,
        pieceCount,
        opponentPieceCount,
        bearOffPos,
        invertPos,
        myBornOff,
        opponentBornOff,
        lastPiecePos,
        opponentLastPiecePos,
        isBearable,
        isRunningGame,
        piecesAt(n: number): number {
            return this.points[n]
        },
        movePiece(from: number, pip: number): Board {
            return doMove(this, from, pip, innerPos)
        },

        revert(): Board {
            const lastPiecePos = invertPos(this.opponentLastPiecePos)
            const opponentLastPiecePos = invertPos(this.lastPiecePos)
            const isBearable = innerPos <= lastPiecePos

            return {
                ...this,
                points: revertPoints(this.points),
                myBornOff: this.opponentBornOff,
                opponentBornOff: this.myBornOff,
                pieceCount: this.opponentPieceCount,
                opponentPieceCount: this.pieceCount,
                lastPiecePos,
                opponentLastPiecePos,
                isBearable,
                myPipCount: this.opponentPipCount,
                opponentPipCount: this.myPipCount,
            }
        },
        myPipCount,
        opponentPipCount,
        innerPos,
    }

    return board
}

function revertPoints(points: number[]): number[] {
    const invertPos = posInverterFor(points)
    return points.map((_, index) => {
        const n = -points[invertPos(index)]

        // remove negative 0
        return n === 0 ? 0 : n
    })
}

function doMove(
    board: Board,
    from: number,
    pip: number,
    innerPos: number
): Board {
    const boardSize = board.points.length - 1 // 25
    // 動かそうとする駒の位置が範囲外
    if (from < 0 || boardSize < from) {
        return board
    }

    // 動かそうとする場所に駒がない
    const piecesToMove = board.points[from]
    if (piecesToMove <= 0) {
        return board
    }

    // ベアオフではなく、行先がブロックされている
    const to = from + pip > boardSize ? boardSize : from + pip
    const isBearOff = boardSize <= to
    if (!isBearOff && board.points[to] < -1) {
        return board
    }

    // 駒を取り上げたあとの盤面を作る
    const piecesAfter = board.points.slice()
    piecesAfter[from] = piecesAfter[from] - 1

    // 必要なら自分の最後尾の駒の位置を更新する

    // 上がりなら、上げた駒の数と最後尾の駒の位置を更新した盤面を返す
    if (isBearOff) {
        const lastPiecePos = recalcLastPiecePos(from, board, piecesAfter)
        const myPipCount = board.myPipCount - (boardSize - from)
        return {
            ...board,
            points: piecesAfter,
            myBornOff: board.myBornOff + 1,
            pieceCount: board.pieceCount - 1,
            lastPiecePos,
            myPipCount,
        }
    }

    let opponentLastPiecePos
    let opponentPipCount = board.opponentPipCount
    // ヒット
    if (piecesAfter[to] === -1) {
        const bar = boardSize

        piecesAfter[to] = 0
        piecesAfter[bar] = piecesAfter[bar] - 1

        // 相手の最後尾の駒の位置をバーに更新する
        opponentLastPiecePos = boardSize

        // ヒットした分のpipcountを更新
        opponentPipCount += to
    } else {
        // ヒットでなければそのまま
        opponentLastPiecePos = board.opponentLastPiecePos
    }

    // 移動先に駒を置く
    piecesAfter[to] = piecesAfter[to] + 1
    const lastPiecePos = recalcLastPiecePos(from, board, piecesAfter)

    // 上がれるかどうかの更新が必要なのは、上がりでない時だけ
    const isBearable = innerPos <= lastPiecePos

    // 自分の分のピップカウントは進めた分だけ減る
    const myPipCount = board.myPipCount - pip
    return {
        ...board,
        points: piecesAfter,
        lastPiecePos,
        opponentLastPiecePos,
        isBearable,
        myPipCount,
        opponentPipCount,
    }
}

function recalcLastPiecePos(
    from: number,
    board: Board,
    piecesAfter: number[]
): number {
    // 動かした駒の位置が最後尾で、そこにあった駒の数が1だった（つまり動かして0になる）なら、
    // あらためて最後尾の駒を探す
    return from == board.lastPiecePos && board.points[from] == 1
        ? piecesAfter.findIndex((n) => 0 < n)
        : board.lastPiecePos
}

function countPip(points: number[]) {
    return points.reduce((prev, cur, idx) => {
        prev += cur > 0 ? cur * (points.length - 1 - idx) : 0
        return prev
    }, 0)
}

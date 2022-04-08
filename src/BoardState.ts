import { DicePip } from './Dices'
import { standardConf } from './GameConf'

/**
 * 相対表記で表現した盤面。常に動かす側の観点になっていて、0はバーポイント、25は上がり、
 * 正の数が自分の駒数となっている。内部的な盤の操作はすべてこのインターフェースを介して行い、
 * 外部へ表示する際にはAbsoluteBoardで変換する
 */
export interface BoardState {
    /** 各ポイントの駒数を格納した配列。正の数は自駒、負の数は相手駒 */
    points: number[]

    /** 最後尾の駒の位置 */
    lastPiecePos: number

    /** ベアリングオフの行き先となる位置（標準は25） */
    bearOffPos: number

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

    /** 盤面で自分側の駒が全て上がったかどうかを、ギャモン・バックギャモンの有無とあわせて返す。
     * ギャモン・バックギャモンは純粋に自駒の配置で判断され、ジャコビールールなどは適用されない。
     * 相手側が終局かどうかは影響しない。
     */
    eogStatus(): EOGStatus
}

/**
 * BoardStateの実装に必要な機能で、外部には公開する必要がないものの定義
 */
type Board = {
    isBackgammonAlso(): boolean

    pieceCount: number
    opponentPieceCount: number
    myBornOff: number
    opponentBornOff: number

    opponentLastPiecePos: number
} & BoardState

/**
 * 終局状態を示す
 */
export type EOGStatus = {
    isEndOfGame: boolean
    isGammon: boolean
    isBackgammon: boolean
    calcStake(cubeValue: number, jacobyRule: boolean): number
}

export function eog(status?: Partial<EOGStatus>): EOGStatus {
    return {
        isEndOfGame: true,
        isGammon: false,
        isBackgammon: false,
        calcStake(cubeValue = 1, jacobyRule = false) {
            // Jacobyルールでは、キューブが動いていなければギャモン・バックギャモンは無視
            return jacobyRule && cubeValue === 1
                ? 1
                : cubeValue * (this.isBackgammon ? 3 : this.isGammon ? 2 : 1)
        },
        ...status,
    }
}

export function countWhitePieces(pieces: number[]) {
    return pieces.filter((n) => n > 0).reduce((n, m) => n + m, 0)
}

export function countRedPieces(pieces: number[]) {
    return countWhitePieces(pieces.map((n) => -n))
}
/**
 * 駒の配置を格納した配列から、BoardStateを生成する
 *
 * @param pieces 駒の配置（省略時は標準ルールでの開始時な配置）
 * @param bornOffs すでにベアリングオフした駒の数の対（順に自分、相手：省略時は0）
 * @returns 盤面
 */
export function boardState(
    pieces: number[] = standardConf.initialPos,
    bornOffs: [number, number] = [0, 0]
): BoardState {
    return initBoardState(pieces, bornOffs)
}

function initBoardState(
    points: number[],
    bornOffs: [number, number] = [0, 0],
    innerPos = 19,
    outerPos = 7
): Board {
    const myBornOff = bornOffs[0]
    const opponentBornOff = bornOffs[1]
    const pieceCount = countWhitePieces(points)
    const opponentPieceCount = countRedPieces(points)
    const bearOffPos = points.length - 1

    const lastPiecePos = points.findIndex((n) => 0 < n)
    const invertPos = (pos: number) => points.length - 1 - pos
    const opponentLastPiecePos = invertPos(
        points.findIndex((_, idx) => points[invertPos(idx)] < 0)
    ) // 無理矢理だが、要するに最後の要素から逆順に、相手駒のある位置を探している

    const isBearable = innerPos <= lastPiecePos

    return {
        points,
        pieceCount,
        opponentPieceCount,
        bearOffPos,
        myBornOff,
        opponentBornOff,
        lastPiecePos,
        opponentLastPiecePos,
        isBearable,
        eogStatus() {
            const isEndOfGame = this.pieceCount === 0
            const isGammon = isEndOfGame && this.opponentBornOff === 0
            const isBackgammon = isGammon && this.isBackgammonAlso()
            return eog({
                isEndOfGame,
                isGammon,
                isBackgammon,
            })
        },
        isBackgammonAlso(): boolean {
            const opponentOuterAndBar = [...Array(outerPos)].map(
                (_, index) => index + innerPos
            )
            return (
                opponentOuterAndBar
                    .map((pos) => this.points[pos])
                    .reduce((m, n) => m + n) < 0
            )
        },
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
                points: this.points.map((_, index) => {
                    const n = -this.points[this.points.length - 1 - index]

                    // remove negative 0
                    return n === 0 ? 0 : n
                }),
                myBornOff: this.opponentBornOff,
                opponentBornOff: this.myBornOff,
                pieceCount: this.opponentPieceCount,
                opponentPieceCount: this.pieceCount,
                lastPiecePos,
                opponentLastPiecePos,
                isBearable,
            }
        },
    }
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

    // 駒を取り上げる
    const piecesAfter = board.points.slice()
    piecesAfter[from] = piecesAfter[from] - 1

    // 必要なら自分の最後尾の駒の位置を更新する

    // 上がりなら、上がり数を更新して終了
    if (isBearOff) {
        const lastPiecePos = recalcLastPiecePos(from, board, piecesAfter)

        return {
            ...board,
            points: piecesAfter,
            myBornOff: board.myBornOff + 1,
            pieceCount: board.pieceCount - 1,
            lastPiecePos,
        }
    }

    let opponentLastPiecePos
    // ヒット
    if (piecesAfter[to] === -1) {
        const bar = boardSize

        piecesAfter[to] = 0
        piecesAfter[bar] = piecesAfter[bar] - 1

        // 相手の最後尾の駒の位置をバーに更新する
        opponentLastPiecePos = boardSize
    } else {
        // ヒットでなければそのまま
        opponentLastPiecePos = board.opponentLastPiecePos
    }

    // 移動先に駒を置く
    piecesAfter[to] = piecesAfter[to] + 1
    const lastPiecePos = recalcLastPiecePos(from, board, piecesAfter)

    // 上がれるかどうかの更新が必要なのは、上がりでない時だけ
    const isBearable = innerPos <= lastPiecePos

    return {
        ...board,
        points: piecesAfter,
        lastPiecePos,
        opponentLastPiecePos,
        isBearable,
    }
}

function recalcLastPiecePos(from: number, board: Board, piecesAfter: number[]) {
    return from == board.lastPiecePos && board.points[from] == 1
        ? piecesAfter.findIndex((n) => 0 < n)
        : board.lastPiecePos
}

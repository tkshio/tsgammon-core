import { DicePip } from "./Dices"

/**
 * 相対表記で表現した盤面。常に動かす側の観点になっていて、0はバーポイント、25は上がり、
 * 正の数が自分の駒数となっている。内部的な盤の操作はすべてこのインターフェースを介して行い、
 * 外部へ表示する際にはAbsoluteBoardで変換する
 */
export interface BoardState {
    /** 各ポイントの駒数を格納した配列。正の数は自駒、負の数は相手駒 */
    points(): number[]

    /** 最後尾の駒の位置 */
    lastPiecePos(): number

    /** ベアリングオフの行き先となる位置（標準は25） */
    bearOffPos(): number

    /** 指定の位置を相手側の視点で見た時の位置に変換する（e.g. 1=>24, 6=>18, ...）*/
    invertPos(pos: number): number

    /** ベアリングオフできるならtrue */
    isBearable(): boolean

    /** 各ポイントの駒数を返す。正の数は自駒、負の数は相手駒 */
    piecesAt(n: number): number

    /** ベアリングオフ済みの自駒数を返す */
    myBornOff(): number

    /** ベアリングオフ済みの相手駒数を返す */
    opponentBornOff(): number

    /** 指定されたポイントの駒をpip分進めた盤面を返す。
     * ポイントに駒がなかったり、行き先がブロックされている・範囲外などの場合、自分自身が返ってくる */
    movePiece(from: number, pip: DicePip): BoardState;

    /** 盤面を相手側視点に変換する */
    revert(): BoardState;

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
    lastPiecePosMemo(): number
    calcLastPiecePos(): number

    isBearableMemo(): boolean
    calcIsBearable(): boolean

    isBackgammonAlso(): boolean

    pieces: number[]
    pieceCount: number
    bornOff: number
    bornOffOpponent: number
    pieceCountOpponent: number
} & BoardState

/**
 * 終局状態を示す
 */
export type EOGStatus = {
    isEndOfGame: boolean,
    isGammon: boolean,
    isBackgammon: boolean
    calcStake(cubeValue: number, jacobyRule: boolean): number;
}

export function eog(status?: Partial<EOGStatus>): EOGStatus {
    return {
        isEndOfGame: true,
        isGammon: false,
        isBackgammon: false,
        calcStake(cubeValue: number = 1, jacobyRule: boolean = false) {
            // Jacobyルールでは、キューブが動いていなければギャモン・バックギャモンは無視
            return (jacobyRule && cubeValue === 1) ? 1 :
                cubeValue *
                (this.isBackgammon ? 3 : (this.isGammon ? 2 : 1))
        },
        ...status
    }
}


export function countWhitePieces(pieces: number[]) {
    return pieces.filter(n => n > 0).reduce((n, m) => n + m, 0)
}

export function countRedPieces(pieces: number[]) {
    return countWhitePieces(pieces.map(n => -n))
}

export function boardState(pieces: number[], bornOffs: [number, number] = [0, 0]): BoardState {
    return initBoardState(pieces, bornOffs)
}

function initBoardState(pieces: number[], bornOffs: [number, number] = [0, 0], innerPos: number = 19): Board {
    const bornOff = bornOffs[0]
    const bornOffOpponent = bornOffs[1]
    const pieceCount = countWhitePieces(pieces)
    const pieceCountOpponent = countRedPieces(pieces)
    
    return {
        pieces: pieces,
        pieceCount: pieceCount,
        pieceCountOpponent: pieceCountOpponent,
        bearOffPos() {
            return pieces.length - 1
        },
        invertPos(pos) {
            return pieces.length - 1 - pos
        },
        bornOff: bornOff,
        bornOffOpponent: bornOffOpponent,
        eogStatus() {
            const isEndOfGame = this.pieceCount === 0
            const isGammon = isEndOfGame && this.opponentBornOff() === 0
            const isBackgammon = isGammon && this.isBackgammonAlso()
            return eog({
                isEndOfGame: isEndOfGame,
                isGammon: isGammon,
                isBackgammon: isBackgammon
            })
        },
        isBackgammonAlso(): boolean {
            const opponentOuterAndBar = [...Array(7)].map((_, index) => index + innerPos)
            return opponentOuterAndBar.map(pos => this.piecesAt(pos)).reduce((m, n) => m + n) < 0
        },
        points(): number[] {
            return this.pieces
        },
        lastPiecePosMemo() {
            return this.calcLastPiecePos()
        },
        isBearableMemo() {
            return this.calcIsBearable()
        },
        isBearable() {
            return this.isBearableMemo()
        },
        calcIsBearable(): boolean {
            const isBearable = (this.pieces
                // インナーボード外の自分の駒が存在しない
                .find((n, index) => index < innerPos && n > 0))
                === undefined

            this.isBearableMemo = () => isBearable
            return isBearable
        },

        lastPiecePos(): number {
            return this.lastPiecePosMemo()
        },

        calcLastPiecePos(): number {
            const lastPos = this.pieces.findIndex((n) => 0 < n)
            this.lastPiecePosMemo = () => lastPos

            return lastPos
        },
        piecesAt(n: number): number {
            return this.pieces[n];
        },
        myBornOff(): number {
            return this.bornOff
        },
        opponentBornOff(): number {
            return this.bornOffOpponent
        },
        movePiece(from: number, pip: number): Board {
            const moved = doMove(this, from, pip)
            return moved === this ? moved : {
                ...moved,
                lastPiecePos() {
                    return this.calcLastPiecePos()
                },
                isBearable() {
                    return this.calcIsBearable()
                },
            }
        },

        revert(): Board {
            return {
                ...this,
                pieces: this.pieces.map((_, index) => {
                    const n = -this.pieces[pieces.length - 1 - index]

                    // remove negative 0
                    return (n === 0) ? 0 : n;
                }),
                bornOff: this.bornOffOpponent,
                bornOffOpponent: this.bornOff,
                pieceCount: this.pieceCountOpponent,
                pieceCountOpponent: this.pieceCount,
                
                // TODO: 単純に再計算するのはもったいない
                lastPiecePos() {
                    return this.calcLastPiecePos()
                },
                isBearable() {
                    return this.calcIsBearable()
                },
            }
        }
    }
}

function doMove(board: Board, from: number, pip: number): Board {
    const boardSize = board.pieces.length - 1 // 25
    // 動かそうとする駒の位置が範囲外
    if (from < 0 || boardSize < from) {
        return board
    }

    // 動かそうとする場所に駒がない
    const piecesToMove = board.pieces[from]
    if (piecesToMove <= 0) {
        return board
    }

    // ベアオフではなく、行先がブロックされている
    const to = from + pip > boardSize ? boardSize : from + pip
    const isBearOff = (boardSize <= to)
    if (!isBearOff && board.pieces[to] < -1) {
        return board
    }

    // 駒を取り上げる
    const piecesAfter = board.pieces.slice()
    piecesAfter[from] = piecesAfter[from] - 1;

    // 上がりなら、上がり数を更新して終了
    if (isBearOff) {
        return {
            ...board,
            pieces: piecesAfter,
            bornOff: board.bornOff + 1,
            pieceCount: board.pieceCount - 1,
        }
    }

    // ヒット
    if (piecesAfter[to] === -1) {
        const bar = boardSize

        piecesAfter[to] = 0
        piecesAfter[bar] = piecesAfter[bar] - 1
    }

    // 移動先に駒を置く
    piecesAfter[to] = piecesAfter[to] + 1;
    return {
        ...board,
        pieces: piecesAfter
    }
}


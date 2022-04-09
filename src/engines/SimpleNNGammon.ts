/**
 *
 * jGammonと同じく、入力198ノード・出力4ノード・三層構成のニューラルネットワークで評価を行うGammonEngine
 *
 * 評価のみで、学習機能は含まれない。
 *
 * @module
 */
import { BoardState } from '../BoardState'
import { simpleEvalEngine } from './GammonEngine'
import { add, Matrix2d, matrix2d, product } from './Matrix'
import {
    hidden_bias,
    hidden_weight,
    output_bias,
    output_weight,
} from './td_default'

/**
 * 評価結果。ニューラルネットワークの出力値（4つ）と、それらの総合点
 *
 * シングル勝ちの確率にはギャモン勝ちの確率が含まれているので、
 * 両者を足せばそのまま勝利時の期待得点となる
 * （e.g. myWin=0.8、myGammon=0.3ならば、シングルでの勝ちは0.8 - 0.3 = 0.5
 *
 * 獲得できる点数の期待値は、
 * 0.5 + 0.3 * 2 = (0.5 + 0.3 ) + 0.3 = 0.8 + 0.3 = 1.1 ）
 *
 */
export type NNEval = {
    /** 獲得点数の期待値 */
    e: number

    /** シングル勝ち（ギャモン勝ちの確率を含む）の確率 */
    myWin: number
    /** ギャモン勝ちの確率 */
    myGammon: number
    /** シングル負け（ギャモン負けの確率を含む）の確率 */
    oppWin: number
    /** ギャモン負けの確率 */
    oppGammon: number
}

/**
 * GammonEngineとして実装されたオブジェクト
 */
export const simpleNNEngine = simpleEvalEngine((board) => evaluate(board).e)

/**
 * 評価関数
 *
 * @param board 盤面
 */
export function evaluate(board: BoardState): NNEval {
    const e = evalWithNN(board.points, board.myBornOff, board.opponentBornOff)
    const [oppWin, oppGammon, myWin, myGammon] = e
    const evalRet = myWin + myGammon - oppWin - oppGammon
    return { e: evalRet, myWin, myGammon, oppWin, oppGammon }
}

const hiddenL: Layer = layer(hidden_weight, hidden_bias)
const outputL: Layer = layer(output_weight, output_bias)

/**
 * テストのためのインターフェース
 *
 * @param pieces 駒の配置
 * @param myBornOff 自分がすでにあげた駒の数
 * @param oppBornOff 相手がすでにあげた駒の数
 */
export function evalWithNN(
    pieces: number[],
    myBornOff: number,
    oppBornOff: number
): number[] {
    const inputValues = matrix2d([encode(pieces, myBornOff, oppBornOff)])
    const hiddenOut = hiddenL.calcOutput(inputValues)
    const output = outputL.calcOutput(hiddenOut)

    return output.arr[0]
}

function encode(
    pieces: number[],
    myBornOff: number,
    oppBornOff: number
): number[] {
    const input: number[] = Array(198)
    pieces.forEach((p, i) => {
        if (1 <= i && i <= 24) {
            const pos = i - 1
            if (p > 0) {
                input[pos * 8] = 1.0 // p > 0
                input[pos * 8 + 1] = p > 1 ? 1.0 : 0.0
                input[pos * 8 + 2] = p > 2 ? 1.0 : 0.0
                input[pos * 8 + 3] = p > 3 ? (p - 3) / 2.0 : 0.0
            } else if (p < 0) {
                input[pos * 8 + 4] = 1.0
                input[pos * 8 + 5] = -p > 1 ? 1.0 : 0.0
                input[pos * 8 + 6] = -p > 2 ? 1.0 : 0.0
                input[pos * 8 + 7] = -p > 3 ? (-p - 3) / 2.0 : 0.0
            }
        }
    })
    const idx = 24 * 8
    input[idx] = pieces[0] / 2.0
    input[idx + 1] = -pieces[25] / 2.0
    input[idx + 2] = myBornOff / 15
    input[idx + 3] = oppBornOff / 15
    input[idx + 4] = 1
    input[idx + 5] = 0

    return input
}

type Layer = {
    weight: Matrix2d
    bias: Matrix2d
    calcOutput(inputValues: Matrix2d): Matrix2d
}

function apply(matrix: Matrix2d, f: (v: number) => number) {
    return matrix2d(
        matrix.arr.map((row) => {
            return row.map(f)
        })
    )
}

function layer(weight: number[][], bias: number[][]): Layer {
    return {
        weight: matrix2d(weight),
        bias: matrix2d(bias),
        calcOutput(inputValues: Matrix2d): Matrix2d {
            const prod = product(inputValues, this.weight)
            return apply(add(prod, this.bias), sigmoid)
        },
    }
}

function sigmoid(v: number) {
    return 1 / (1 + Math.pow(Math.E, -v))
}

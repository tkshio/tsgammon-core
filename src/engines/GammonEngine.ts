import { BoardState } from '../BoardState'
import { BoardStateNode } from '../BoardStateNode'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'
import { CubeState } from '../CubeState'
import { collectNodes } from '../utils/collectNodes'
import { Evaluator } from './Evaluator'

/**
 * チェッカープレイとキューブアクションを判断する思考エンジンが実装するインターフェース
 */
export type GammonEngine = {
    /**
     * ゲームの開始前に一度呼ばれる
     */
    initialized(): void

    /**
     * ダブルをするかどうかを返す
     *
     * @param boardState 局面
     * @param cubeState キューブ（値はダブル前の値）
     * @returns ダブルするならisDouble=trueを返す
     */
    cubeAction(
        boardState: BoardState,
        cubeState: CubeState
    ): { isDouble: boolean }

    /**
     * テイクするかどうかを返す
     *
     * @param boardState 局面
     * @param cubeState キューブ（値はダブル前の値）
     * @returns テイクするならisDouble=trueを返す
     */
    cubeResponse(
        boardState: BoardState,
        cubeState: CubeState
    ): { isTake: boolean }

    /**
     * チェッカープレイを行い、その結果の局面を返す。
     *
     * @param boardStateNode 局面
     * @returns プレイ後の局面（引数のboardStateNodeと同じ視点）。boardStateNodeの子局面が想定されているが、任意の局面を設定してもよい。また、手がない場合は引数をそのまま返す。
     */
    checkerPlay(boardStateNode: BoardStateNodeRoot): BoardStateNode

    /**
     * ゲーム終了後に一度呼ばれる。
     *
     * @param boardStateNode 局面
     */
    endOfGame(boardStateNode: BoardStateNode): void
}

/**
 * 乱数エンジンを返す。キューブアクションは判断せず（ダブルはしない・常にテイク）、
 * チェッカープレイは候補手からランダムに選ぶ。
 *
 * @returns 乱数エンジン
 */
export function randomEngine(): GammonEngine {
    return {
        initialized(): void {
            //
        },
        cubeAction(): { isDouble: boolean } {
            return { isDouble: false }
        },
        cubeResponse(): { isTake: boolean } {
            return { isTake: true }
        },
        checkerPlay(node: BoardStateNodeRoot): BoardStateNode {
            const nodes = collectNodes(node).filter((node) => !node.isRedundant)

            if (nodes.length === 0) {
                return node.root
            }
            const n = Math.floor(Math.random() * nodes.length)
            return nodes[n]
        },

        endOfGame(): void {
            // do nothing.
        },
    }
}

/**
 * 局面評価をする関数から、簡易なGammonEngineを生成する。
 *
 * キューブアクションは、期待値0.40（勝率70%）でダブル、-0.5（勝率25%）より上でテイク。
 *
 * @param evaluate 局面評価をする関数
 * @returns GammonEngine
 */
export function simpleEvalEngine(
    evaluate: (board: BoardState) => number
): GammonEngine {
    const evaluator: Evaluator = {
        initialize: () => {
            //
        },
        endOfGame: () => {
            //
        },
        evaluate,
    }
    return simpleEvalEngineWithEvaluator(evaluator)
}

export function simpleEvalEngineWithEvaluator(ev: Evaluator): GammonEngine {
    return {
        initialized(): void {
            ev.initialize()
        },
        cubeAction(board: BoardState): { isDouble: boolean } {
            return { isDouble: ev.evaluate(board) > 0.4 }
        },
        cubeResponse(board: BoardState): { isTake: boolean } {
            return { isTake: ev.evaluate(board) > -0.5 }
        },
        checkerPlay(node: BoardStateNodeRoot): BoardStateNode {
            const candidates = collectNodes(node).filter(
                (node) => !node.isRedundant
            )
            const bestEv = candidates
                .map((node) => ({ node, e: ev.evaluate(node.board) }))
                .reduce((prev, cur) => (prev.e > cur.e ? prev : cur), {
                    node: node.root,
                    e: Number.NEGATIVE_INFINITY,
                })
            return bestEv.node
        },
        endOfGame(boardStateNode: BoardStateNode): void {
            ev.endOfGame(boardStateNode)
        },
    }
}

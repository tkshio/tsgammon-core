import { BoardState } from "../BoardState";
import { BoardStateNode } from "../BoardStateNode";

/**
 * 盤面の評価のみを行う思考エンジンが実装するインターフェース。
 */

export type Evaluator = {
    /**
     * ゲームの開始前に一度呼ばれる
     */
    initialize(): void;

    /**
     * 盤面に対する評価値を返す。チェッカープレイでは、候補のうち、
     * もっとも高い評価値の盤面が選ばれる。
     * キューブアクションも判定させる場合は、自分の獲得点の期待値
     * （1 = シングル勝ち100%、-1 = シングル負け100%）として返す必要がある。
     *
     * @param boardState 盤面
     * @returns 評価値
     */
    evaluate(boardState: BoardState): number;

    /**
     * ゲーム終了後に一度呼ばれる。
     *
     * @param boardStateNode 局面
     */
    endOfGame(boardStateNode: BoardStateNode): void;

};

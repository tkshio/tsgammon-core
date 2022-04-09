/**
 * ポイントマッチにおける、赤白両者の累計点、または１回のゲームでの得点を表す。
 *
 * 後者の場合、得点しなかった側は0点である想定だが、特に制約は設けていない。
 */
export type Score = {
    whiteScore: number
    redScore: number
    /**
     * 得点を加算した結果を返す
     * @param score 得点
     */
    add(score: Score): Score

    /**
     * 両者の点数の合計を返す。
     * 得点として用いる場合（すなわちいずれかがvalue点でもう一方が0点）の、数値表現として使用する。
     */
    value: number
}

/**
 * 赤の得点を生成する
 * @param n 赤の得点
 * @returns
 */
export function scoreAsRed(n: number): Score {
    return score({
        whiteScore: 0,
        redScore: n,
    })
}
/**
 * 白の得点を生成する
 * @param n 白の点数
 * @returns
 */
export function scoreAsWhite(n: number): Score {
    return score({
        whiteScore: n,
        redScore: 0,
    })
}

/**
 * 任意の内容の累計点を生成する
 * @param value 累計点
 * @returns
 */
export function score(
    value: { redScore?: number; whiteScore?: number } = {
        redScore: 0,
        whiteScore: 0,
    }
): Score {
    const redScore: number = value.redScore ?? 0
    const whiteScore: number = value.whiteScore ?? 0
    return {
        redScore,
        whiteScore,
        add(score) {
            return {
                ...this,
                redScore: this.redScore + score.redScore,
                whiteScore: this.whiteScore + score.whiteScore,
            }
        },
        value: redScore + whiteScore,
    }
}

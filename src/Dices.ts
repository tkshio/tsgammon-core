/**
 * ダイスの目のペアを表す
 */
export type DiceRoll = { dice1: DicePip; dice2: DicePip }

export type DiceRoll0 = { dice1: DicePip | 0; dice2: DicePip | 0 }
/**
 * ダイスの目のペアを生成する
 *
 * @param dice1 ダイスの目
 * @param dice2 ダイスの目
 * @returns ダイスの目のペア
 */
export function diceRoll(dice1: DicePip, dice2: DicePip): DiceRoll {
    return { dice1, dice2 }
}

/**
 * ダイスの目を表す
 */
export type DicePip = 1 | 2 | 3 | 4 | 5 | 6

/**
 * ダイスの目と、その使用状況を表す
 */
export type Dice = {
    /**
     * ダイスの目
     */
    pip: DicePip

    /**
     * 駒の移動により使用された場合、または最初から使用できない場合 true
     */
    used: boolean
}

/**
 * DicePipを指定した数の要素を持つDiceの配列に変換する
 * @param dicePip ダイスの目
 * @param count 要素数
 * @returns 未使用の状態のDice配列
 */
export function dices(dicePip: DicePip, count: number): Dice[] {
    return Array(count).map(() => dice(dicePip))
}

/**
 * ダイスの目を使用状態を持たせてオブジェクトにする
 * @param pip ダイスの目
 * @returns 未使用の状態のダイス
 */
export function dice(pip: DicePip): Dice {
    return { pip, used: false }
}

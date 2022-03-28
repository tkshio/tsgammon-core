/**
 * ダイスの目のペアを表す
 */
export type DiceRoll = { dice1: DicePip, dice2: DicePip }

/**
 * ダイスの目を表す
 */
export type DicePip = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * ダイスの目と、その使用状況を表す
 */
export type Dice = {
    /**
     * ダイスの目
     */
    pip: DicePip
    /**
     * 駒の移動により使用、または最初から使用できない場合 true
     */
    used: boolean;
}

/**
 * DicePipの配列を、Diceの配列に変換する
 * @param dicePips ダイスの目を格納した配列
 * @returns 未使用の状態のDice配列
 */
export function dices(...dicePips: DicePip[]): Dice[] {
    return dicePips.map(dice)
}

/**
 * DicePipを、Diceに変換する
 * @param dicePips ダイスの目を格納した配列
 * @returns 未使用の状態のDice配列
 */
export function dice(pip:DicePip):Dice{
    return ({pip, used:false})
}

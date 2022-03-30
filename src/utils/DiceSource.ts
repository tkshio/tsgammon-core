import { DicePip, DiceRoll } from '../Dices'

/**
 * ダイスをロールして、その目を提供するインターフェース
 */
export type DiceSource = {
    /**
     * ダイス二つをまとめて振る
     *
     * @param tag 統計用（未実装）
     */
    roll(tag?: string): DiceRoll
    /**
     * ダイス二つをまとめて振る。ただし、ゾロ目が出たらやり直す。
     *
     * あまりにゾロ目が続く場合は、例外が発生する
     *
     * @param tag 統計用（未実装）
     */
    openingRoll(tag?: string): DiceRoll
}

function diceSource(doRoll: () => DicePip): DiceSource {
    const doRollDices = () => ({ dice1: doRoll(), dice2: doRoll() })
    return {
        roll: doRollDices,
        openingRoll: () => asOpeningRoll(doRollDices),
    }
}

export const randomDiceSource: DiceSource = diceSource(rollMathRandom)

/**
 * 指定された配列が尽きるまでは、その内容がロール結果として返る
 * 尽きた後は、randomDiceSourceと同じ動作をする
 * @param pips ロール結果として返したい目の配列
 */
export function presetDiceSource(...pips: DicePip[]): DiceSource {
    const pipEntries = pips.entries()
    const doRoll: () => DicePip = () => {
        const value = pipEntries.next()
        return value.done ? rollMathRandom() : value.value[1]
    }
    return diceSource(doRoll)
}

function asOpeningRoll(src: () => DiceRoll): DiceRoll {
    let counter = 0
    do {
        const dices = src()
        if (dices.dice1 !== dices.dice2) {
            return dices
        }
        counter++
    } while (counter < 1000)

    throw new Error('Too many doublets')
}

export function rollMathRandom(): DicePip {
    return (Math.floor(Math.random() * 6) + 1) as DicePip
}

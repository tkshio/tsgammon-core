import { DicePip } from '../Dices'

/**
 * ダイスの目のペアを文字列として出力する。
 *
 * ```typescript
 * formatDices([1,3])          // "13"
 * formatDices([1,3,4])        // "13" <- 先頭の二つ以外は無視
 * formatDices([3,3,3,3],true) // "3(4)"
 * formatDices([3,3,3,3])      // "3333"
 * formatDices([3,3,4])        // "333"
 * formatDices([])             // ""
 * ```
 *
 * @param dices ダイスの目のペア
 * @param fmtDoublet trueの場合、dices[0]とdices[1]が同じ目であればゾロ目と見なして別形式で表記する
 * @returns
 */
export function formatDices(
    dices: DicePip[],
    fmtDoublet: boolean = true
): string {
    if (dices.length === 0) {
        return ''
    }

    if (dices.length === 1) {
        return dices[0] + ''
    }
    return fmtDoublet && dices[0] === dices[1]
        ? `${dices[0]}(${dices.length})` // ex. [3,3,3,3] => 3(4)
        : `${dices[0]}${dices[1]}` // [3,4] => 3/4, [6,6] => 66
}

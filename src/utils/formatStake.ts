import { EOGStatus } from '../EOGStatus'
import { Score } from '../Score'

/**
 * 得点及び終局状態を文字列に変換する。
 *
 * @param stake 得点：0の側が敗者、そうでない側が勝者となる
 * @param eog 終局状態
 * @param redPlayer Red側のプレイヤー名
 * @param whitePlayer White側のプレイヤー名
 * @returns 変換後の文字列
 */
export function formatStake(
    stake: Score,
    eog: EOGStatus,
    redPlayer = 'Red',
    whitePlayer = 'White'
) {
    const gammon = eog.isBackgammon
        ? ' by Backgammon'
        : eog.isGammon
        ? ' by Gammon'
        : ''

    const red = format(redPlayer, stake.redScore, gammon)
    const white = format(whitePlayer, stake.whiteScore, gammon)
    return red + white

    function format(player: string, score: number, gammon: string) {
        return score === 0 ? '' : `${player} wins ${score} pt.${gammon}`
    }
}

import { Score } from '../Score'

/**
 * スコアを文字列に変換する
 *
 * ex) Red:1 - White:1
 *
 * @param score スコア
 * @param redPlayer Red側のプレイヤー名
 * @param whitePlayer White側のプレイヤー名
 *
 * @returns 変換後の文字列
 */
export function formatScore(
    score: Score,
    redPlayer = 'Red',
    whitePlayer = 'White'
) {
    return `Score: ${redPlayer}:${score.redScore} - ${whitePlayer}:${score.whiteScore}`
}

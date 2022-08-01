import { CubeOwner, CubeState } from './CubeState'
import { StakeConf } from './StakeConf'
import { EOGStatus } from './EOGStatus'
import { Score, score } from './Score'

/**
 * マッチ中のスコア他、クロフォードの有無などの状況を表す型
 */
export type MatchState = MatchStateInPlay | MatchStateEoG

type _MatchState = {
    /**
     * マッチの長さ、0の場合は無制限
     */
    matchLength: number
    /**
     * ゲーム開始時点でのスコア
     */
    scoreBefore: Score
    /**
     * 現時点（ゲーム進行中）、または更新後（ゲーム終了後）のスコア
     */
    score: Score
    /**
     * スコアに関するルール設定
     */
    stakeConf: StakeConf
    /**
     * 進行中、または直前に終了したゲームがクロフォードゲームならtrue
     */
    isCrawford: boolean
}

/**
 * ゲームが進行中の時のスコアを表す型
 */
export type MatchStateInPlay = _MatchState & {
    isEoG: false
}

/**
 * ゲームが終了した時点で、その前後のスコアを表す型
 */
export type MatchStateEoG = _MatchState & {
    isEoG: true
    /**
     * ゲームにより獲得した点数
     */
    stake: Score
    /**
     * 終了後のスコア
     */
    scoreAfter: Score
    /**
     * 終局状態
     */
    eogStatus: EOGStatus
    /**
     * マッチが決着しているならtrue
     */
    isEoM: boolean
    /**
     * 次ゲームがクロフォードゲームならtrue
     */
    isCrawfordNext: boolean
}
/**
 * 無制限のマッチゲームを開始する
 *
 * @param scoreBefore 開始時点での両プレイヤーのスコア
 * @param jacobyRule ジャコビールールを適用する場合はtrue
 * @returns
 */
export function matchStateForUnlimitedMatch(
    scoreBefore: Score = score(),
    jacobyRule = true
) {
    return matchStateInPlay(0, scoreBefore, jacobyRule, false)
}

/**
 * ポイントマッチを開始する。
 *
 * @param matchLength マッチの長さ
 * @param scoreBefore 開始時点での両プレイヤーのスコア
 * @param isCrawford 次ゲームをクロフォードとするならtrue。スコアとマッチの長さについてのチェックは行わない
 * @returns
 */
export function matchStateForPointMatch(
    matchLength: number,
    scoreBefore: Score = score(),
    isCrawford = false
): MatchStateInPlay {
    return matchStateInPlay(matchLength, scoreBefore, false, isCrawford)
}

/**
 * 現在のマッチ状態で、isRedで指定されたプレイヤーについてキューブアクション可能かどうかを返す
 *
 * @param matchState マッチの状況
 * @param cubeValue キューブの値
 * @param isRed Redについて確認するならtrue / Whiteならfalse
 * @returns
 */
export function shouldSkipCubeAction(
    matchState: MatchState,
    cubeValue: number,
    isRed: boolean
) {
    return (
        matchState.isCrawford || //
        isCubeMaxFor(matchState, cubeValue, isRed)
    )
}

function isCubeMaxFor(
    matchState: MatchState,
    cubeValue: number,
    isRed: boolean
) {
    return (
        matchState.matchLength > 0 &&
        matchState.matchLength <=
            cubeValue +
                (isRed
                    ? matchState.score.redScore
                    : matchState.score.whiteScore)
    )
}

/**
 * 現在のマッチの状態で、キューブが最大値に達しているかどうかをキューブの状態から判定する（したがって、クロフォードは影響しない）。
 *
 * shouldSkipCubeAction()とは、プレイヤーの指定を必要としないことと、クロフォードを含めない点で異なっている。
 *
 * （これは、キューブが使えない理由があるのはキューブ状態かクロフォードルールかを呼び出し側で把握するために判定から除外した）。
 *
 * @param matchState マッチの状態
 * @param cubeState キューブの状態
 * @returns
 */
export function isCubeMaxForMatch(
    matchState: MatchState,
    cubeState: CubeState
) {
    return _isCubeMaxForMatch(matchState, cubeState.value, cubeState.owner)

    function _isCubeMaxForMatch(
        matchState: MatchState,
        cubeValue: number,
        cubeOwner?: CubeOwner
    ): boolean {
        return cubeOwner === undefined
            ? isDoubleMatchPoint(matchState)
            : isCubeMaxFor(matchState, cubeValue, cubeOwner === CubeOwner.RED)

        function isDoubleMatchPoint(matchState: MatchState): boolean {
            return (
                matchState.score.redScore === matchState.matchLength - 1 &&
                matchState.score.whiteScore === matchState.matchLength - 1
            )
        }
    }
}

function matchStateInPlay(
    matchLength: number,
    scoreBefore: Score,
    jacobyRule: boolean,
    isCrawford = false
): MatchStateInPlay {
    return {
        isEoG: false,
        matchLength,
        scoreBefore,
        score: scoreBefore,
        stakeConf: { jacobyRule },
        isCrawford,
    }
}

/**
 * ゲーム終了時のマッチ状態を生成する
 * @param matchState マッチ状態
 * @param stake 獲得したスコア
 * @param eogStatus 終局状態
 * @returns
 */
export function matchStateEoG(
    matchState: MatchState,
    stake: Score,
    eogStatus: EOGStatus
): MatchStateEoG {
    const scoreAfter = matchState.scoreBefore.add(stake)
    return {
        ...matchState,
        isEoG: true,
        score: scoreAfter,
        stake,
        eogStatus,
        scoreAfter,
        isEoM: isEndOfMatch(matchState.matchLength, scoreAfter),
        isCrawfordNext: isCrawfordNext(
            matchState.matchLength,
            matchState.scoreBefore,
            scoreAfter
        ),
    }
}

/**
 * 終局時のマッチ状態から、終局直前のマッチ状態を生成する。
 *
 * これは、記録を遡って再開する時、終局状態を解除するために使用している。
 *
 * @param matchState 終局時のマッチ状態
 * @returns
 */
export function matchStateLastGame(matchState: MatchStateEoG) {
    return matchStateInPlay(
        matchState.matchLength,
        matchState.scoreBefore,
        matchState.stakeConf.jacobyRule,
        matchState.isCrawford
    )
}

/**
 * 終局時のマッチ状態から、次のゲームを開始したマッチ状態を生成する
 * @param matchState 終局時のマッチ状態
 * @returns
 */
export function matchStateNewGame(matchState: MatchStateEoG) {
    return matchStateInPlay(
        matchState.matchLength,
        matchState.scoreAfter,
        matchState.stakeConf.jacobyRule,
        matchState.isCrawfordNext
    )
}

function isCrawfordNext(
    matchLength: number,
    scoreBefore: Score,
    scoreAfter: Score
): boolean {
    return (
        matchLength !== 0 &&
        scoreBefore.redScore < matchLength - 1 &&
        scoreBefore.whiteScore < matchLength - 1 &&
        (scoreAfter.redScore === matchLength - 1 ||
            scoreAfter.whiteScore === matchLength - 1)
    )
}

function isEndOfMatch(matchLength: number, score: Score) {
    return (
        matchLength !== 0 &&
        (score.redScore >= matchLength || score.whiteScore >= matchLength)
    )
}

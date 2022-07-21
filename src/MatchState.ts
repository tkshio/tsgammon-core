import { CubeOwner, CubeState } from './CubeState'
import { StakeConf } from './StakeConf'
import { EOGStatus } from './EOGStatus'
import { Score, score } from './Score'

export type MatchState = MatchStateInPlay | MatchStateEoG

type _MatchState = {
    matchLength: number
    scoreBefore: Score
    score: Score
    stakeConf: StakeConf
    isCrawford: boolean
}

export type MatchStateInPlay = _MatchState & {
    isEoG: false
}
export type MatchStateEoG = _MatchState & {
    isEoG: true
    stake: Score
    scoreAfter: Score
    eogStatus: EOGStatus
    isEoM: boolean
    isCrawfordNext: boolean
}
export function matchStateForUnlimitedMatch(
    scoreBefore: Score = score(),
    jacobyRule = true,
    isCrawford = false
) {
    return matchStateInPlay(0, scoreBefore, jacobyRule, isCrawford)
}

export function matchStateForPointMatch(
    matchLength: number,
    scoreBefore: Score = score(),
    isCrawford = false
): MatchStateInPlay {
    return matchStateInPlay(matchLength, scoreBefore, false, isCrawford)
}

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

export function matchStateLastGame(matchState: MatchStateEoG) {
    return matchStateInPlay(
        matchState.matchLength,
        matchState.scoreBefore,
        matchState.stakeConf.jacobyRule,
        matchState.isCrawford
    )
}

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

import { EOGStatus } from '../EOGStatus'
import { Score, score } from '../Score'
import { StakeConf } from './StakeConf'

export type MatchState = MatchStateInPlay | MatchStateEoG

type _MatchState = {
    matchLength: number
    scoreBefore: Score
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
    jacobyRule = true
) {
    return matchStateInPlay(0, scoreBefore, jacobyRule)
}

export function matchStateForPointMatch(
    matchLength: number,
    scoreBefore: Score = score()
): MatchStateInPlay {
    return matchStateInPlay(matchLength, scoreBefore, false)
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
        scoreBefore: matchState.scoreBefore,
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

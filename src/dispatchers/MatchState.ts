import { EOGStatus } from '../EOGStatus'
import { Score, score } from '../Score'
import { CBEoG } from './CubeGameState'
import { StakeConf } from './StakeConf'

export type MatchState = MatchStateInPlay | MatchStateEOG

type _MatchState = {
    matchLength: number
    scoreBefore: Score
    stakeConf: StakeConf
    isCrawford: boolean
}

export type MatchStateInPlay = _MatchState & {
    isEoG: false
}
export type MatchStateEOG = _MatchState & {
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
    return matchStateInPlay(0, scoreBefore, { jacobyRule })
}

export function matchStateForPointMatch(
    matchLength: number,
    scoreBefore: Score = score()
): MatchStateInPlay {
    return matchStateInPlay(matchLength, scoreBefore, { jacobyRule: false })
}

export function matchStateInPlay(
    matchLength: number,
    scoreBefore: Score,
    stakeConf: StakeConf = { jacobyRule: false },
    isCrawford = false
): MatchStateInPlay {
    return {
        isEoG: false,
        matchLength,
        scoreBefore,
        stakeConf,
        isCrawford,
    }
}

export function matchStateEOG(
    matchState: MatchState,
    cbState: CBEoG
): MatchState {
    const { stake, eogStatus } = cbState.calcStake(matchState.stakeConf)
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

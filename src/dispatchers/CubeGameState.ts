import { CubeOwner, CubeState } from '../CubeState'
import { eog, EOGStatus } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { score, Score, scoreAsRed, scoreAsWhite } from '../Score'
import { applyStakeConf, StakeConf } from '../StakeConf'

export type CBState =
    | CBOpening
    | CBInPlay
    | CBAction
    | CBResponse
    | CBToRoll
    | CBEoG
export type CBOpening = _CBState & {
    tag: 'CBOpening'

    doStartCheckerPlayRed: () => CBInPlayRed
    doStartCheckerPlayWhite: () => CBInPlayWhite
}

export type CBAction = CBActionRed | CBActionWhite
export type CBResponse = CBResponseRed | CBResponseWhite
export type CBToRoll = CBToRollRed | CBToRollWhite
export type CBInPlay = CBInPlayRed | CBInPlayWhite
export type CBEoG = CBEoGRedWon | CBEoGWhiteWon | CBEoGNogame
type _CBState = {
    cubeState: CubeState
}

type _CBAction = _CBState & {
    tag: 'CBAction'
}

export type CBActionRed = _CBAction & {
    isRed: true
    doDouble: () => CBResponseWhite
    doStartCheckerPlay: () => CBInPlayRed
    doSkipCubeAction: () => CBToRollRed
}

export type CBActionWhite = _CBAction & {
    isRed: false
    doDouble: () => CBResponseRed
    doStartCheckerPlay: () => CBInPlayWhite
    doSkipCubeAction: () => CBToRollWhite
}

type _CBResponse = _CBState & {
    tag: 'CBResponse'
    isRed: boolean
}
export type CBResponseRed = _CBResponse & {
    doTake: () => CBToRollWhite
    doPass: () => CBEoGWhiteWon
    isDoubleFromRed: false
    isRed: true
}
export type CBResponseWhite = _CBResponse & {
    doTake: () => CBToRollRed
    doPass: () => CBEoGRedWon
    isDoubleFromRed: true
    isRed: false
}
type LastCubeAction = 'Take' | 'Skip'

type _CBToRoll = _CBState & {
    tag: 'CBToRoll'
    lastAction: LastCubeAction
}
export type CBToRollRed = _CBToRoll & {
    isRed: true
    doStartCheckerPlay: () => CBInPlayRed
}
export type CBToRollWhite = _CBToRoll & {
    isRed: false
    doStartCheckerPlay: () => CBInPlayWhite
}

type _CBInPlay = _CBState & {
    tag: 'CBInPlay'
    mayDouble: boolean
}
export type CBInPlayRed = _CBInPlay & {
    isRed: true
    doStartCubeAction: (
        skipCubeAction: boolean
    ) => CBActionWhite | CBToRollWhite
}
export type CBInPlayWhite = _CBInPlay & {
    isRed: false
    doStartCubeAction: (skipCubeAction: boolean) => CBActionRed | CBToRollRed
}

type _CBEoG = _CBState & {
    tag: 'CBEoG'

    eogStatus: EOGStatus
    isWonByPass: boolean
    calcStake: (conf?: StakeConf) => {
        stake: Score
        eogStatus: EOGStatus
        jacobyApplied: boolean
    }
}

export type CBEoGRedWon = _CBEoG & {
    result: SGResult.REDWON
}

export type CBEoGWhiteWon = _CBEoG & {
    result: SGResult.WHITEWON
}

export type CBEoGNogame = _CBEoG & {
    isWonByPass: false
    result: SGResult.NOGAME
}

export function cbOpening(cubeState: CubeState): CBOpening {
    return {
        tag: 'CBOpening',
        cubeState,
        doStartCheckerPlayRed: () => cbInPlayRed(cubeState),
        doStartCheckerPlayWhite: () => cbInPlayWhite(cubeState),
    }
}

export function cbActionRed(cubeState: CubeState): CBActionRed {
    return {
        tag: 'CBAction',
        isRed: true,
        cubeState,
        doDouble: () => {
            return cbResponseWhite(cubeState)
        },
        doStartCheckerPlay: () => {
            return cbInPlayRed(cubeState)
        },
        doSkipCubeAction: () => {
            return cbToRollRed(cubeState, 'Skip')
        },
    }
}
export function cbActionWhite(cubeState: CubeState): CBActionWhite {
    return {
        tag: 'CBAction',
        isRed: false,
        cubeState,
        doDouble: () => {
            return cbResponseRed(cubeState)
        },
        doStartCheckerPlay: () => {
            return cbInPlayWhite(cubeState)
        },
        doSkipCubeAction: () => {
            return cbToRollWhite(cubeState, 'Skip')
        },
    }
}
export function cbInPlayRed(cubeState: CubeState): CBInPlayRed {
    const mayDouble = cubeState.mayDoubleFor(CubeOwner.WHITE)
    return {
        tag: 'CBInPlay',
        isRed: true,
        cubeState,
        mayDouble,
        doStartCubeAction(
            skipCubeAction: boolean
        ): CBActionWhite | CBToRollWhite {
            return mayDouble && !skipCubeAction
                ? cbActionWhite(cubeState)
                : cbToRollWhite(cubeState, 'Skip')
        },
    }
}
export function cbInPlayWhite(cubeState: CubeState): CBInPlayWhite {
    const mayDouble = cubeState.mayDoubleFor(CubeOwner.RED)
    return {
        tag: 'CBInPlay',
        isRed: false,
        cubeState,
        mayDouble,
        doStartCubeAction(skipCubeAction: boolean): CBActionRed | CBToRollRed {
            return mayDouble && !skipCubeAction
                ? cbActionRed(cubeState)
                : cbToRollRed(cubeState, 'Skip')
        },
    }
}
export function cbResponseRed(cubeState: CubeState): CBResponseRed {
    const cbResponse: CBResponseRed = {
        tag: 'CBResponse',
        isDoubleFromRed: false,
        isRed: true,
        cubeState,
        doTake: () => {
            return doAccept(CubeOwner.RED, cbToRollWhite, cubeState)
        },
        doPass: () => {
            return cbEoGWhiteWon(cubeState, eog(), true)
        },
    }
    return cbResponse
}
export function cbResponseWhite(cubeState: CubeState): CBResponseWhite {
    const cbResponse: CBResponseWhite = {
        tag: 'CBResponse',
        isDoubleFromRed: true,
        isRed: false,
        cubeState,
        doTake: () => {
            return doAccept(CubeOwner.WHITE, cbToRollRed, cubeState)
        },
        doPass: () => {
            return cbEoGRedWon(cubeState, eog(), true)
        },
    }
    return cbResponse
}

function doAccept<T extends CBToRoll>(
    side: CubeOwner,
    cbToRoll: (cubeState: CubeState, cubeAction: LastCubeAction) => T,
    cubeState: CubeState
): T {
    return cbToRoll(cubeState.double(side), 'Take')
}

export function cbToRollRed(
    cubeState: CubeState,
    lastAction: LastCubeAction
): CBToRollRed {
    return {
        tag: 'CBToRoll',
        isRed: true,
        cubeState,
        doStartCheckerPlay: () => {
            return cbInPlayRed(cubeState)
        },
        lastAction,
    }
}
export function cbToRollWhite(
    cubeState: CubeState,
    lastAction: LastCubeAction
): CBToRollWhite {
    return {
        tag: 'CBToRoll',
        isRed: false,
        cubeState,
        doStartCheckerPlay: () => {
            return cbInPlayWhite(cubeState)
        },
        lastAction,
    }
}

export function resultToCBEoG(
    cubeState: CubeState,
    sgResult: SGResult,
    eogStatus: EOGStatus
): CBEoG {
    switch (sgResult) {
        case SGResult.WHITEWON:
            return cbEoGWhiteWon(cubeState, eogStatus, false)
        case SGResult.REDWON:
            return cbEoGRedWon(cubeState, eogStatus, false)
        case SGResult.NOGAME:
            return cbEoGNogame(cubeState, eogStatus)
    }
}

function cbEoGRedWon(
    cubeState: CubeState,
    eogStatus: EOGStatus,
    isWonByPass: boolean
): CBEoGRedWon {
    return {
        tag: 'CBEoG',
        cubeState,
        result: SGResult.REDWON,
        eogStatus,
        isWonByPass,
        calcStake: (stakeConf?: StakeConf) => {
            const applied = applyStakeConf(cubeState, eogStatus, stakeConf)
            return {
                ...applied,
                stake: scoreAsRed(applied.stake),
            }
        },
    }
}

function cbEoGWhiteWon(
    cubeState: CubeState,
    eogStatus: EOGStatus,
    isWonByPass: boolean
): CBEoGWhiteWon {
    return {
        tag: 'CBEoG',
        cubeState,
        result: SGResult.WHITEWON,
        eogStatus,
        isWonByPass,
        calcStake: (stakeConf?: StakeConf) => {
            const applied = applyStakeConf(cubeState, eogStatus, stakeConf)
            return {
                ...applied,
                stake: scoreAsWhite(applied.stake),
            }
        },
    }
}

function cbEoGNogame(cubeState: CubeState, eogStatus: EOGStatus): CBEoGNogame {
    return {
        tag: 'CBEoG',
        cubeState,
        result: SGResult.NOGAME,
        eogStatus,
        isWonByPass: false,
        calcStake: () => {
            return {
                stake: score(),
                eogStatus,
                jacobyApplied: false,
            }
        },
    }
}

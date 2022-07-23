import { EOGStatus } from '../../EOGStatus'
import { SGResult } from '../../records/SGResult'
import {
    SGState,
    eogStateWhite,
    eogStateRed,
    eogStateNogame,
} from '../SingleGameState'

export function sgResultToSGEoG(
    sgState: SGState,
    sgResult: SGResult,
    eogStatus: EOGStatus
) {
    const stakeValue = eogStatus.calcStake(1)
    const { absBoard, boardState } = sgState
    switch (sgResult) {
        case SGResult.WHITEWON:
            return eogStateWhite(stakeValue, eogStatus, absBoard, boardState)
        case SGResult.REDWON:
            return eogStateRed(stakeValue, eogStatus, absBoard, boardState)
        case SGResult.NOGAME:
            return eogStateNogame(eogStatus, absBoard, boardState)
    }
}

import { EOGStatus } from '../../EOGStatus'
import { SGResult } from '../../records/SGResult'
import {
    SGState,
    eogStateWhite,
    eogStateRed,
    eogStateNogame,
} from '../SingleGameState'

/**
 * 任意の局面と、勝敗の指定からSGEoGオブジェクトを生成する
 * @param sgState 現局面
 * @param sgResult 勝敗
 * @param eogStatus 終局状態
 * @returns
 */
export function sgResultToSGEoG(
    sgState: SGState,
    sgResult: SGResult,
    eogStatus: EOGStatus
) {
    const stakeValue = eogStatus.calcStake(1)
    const { absBoard, boardState } = sgState
    switch (sgResult) {
        case SGResult.WHITEWON:
            return eogStateWhite(stakeValue, eogStatus, boardState)
        case SGResult.REDWON:
            return eogStateRed(stakeValue, eogStatus, boardState)
        case SGResult.NOGAME:
            return eogStateNogame(eogStatus, absBoard, boardState)
    }
}

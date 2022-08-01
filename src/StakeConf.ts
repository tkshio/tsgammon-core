import { CubeState } from './CubeState'
import { EOGStatus } from './EOGStatus'

/**
 * スコア算出に関わるルール設定項目
 */
export type StakeConf = {
    /** ジャコビールール：キューブが未使用の場合ギャモン・バックギャモンを無効とするルールを有効にするならtrue */
    jacobyRule: boolean
}

/**
 * キューブ、終局状態、ルール設定からスコアを算出する
 *
 * @param cubeState キューブ状態
 * @param eogStatus 終局状態
 * @param stakeConf ルール設定
 * @returns
 */
export function applyStakeConf(
    cubeState: CubeState,
    eogStatus: EOGStatus,
    stakeConf: StakeConf = { jacobyRule: false }
): { eogStatus: EOGStatus; stake: number; jacobyApplied: boolean } {
    const jacobyApplied = stakeConf.jacobyRule && cubeState.owner === undefined

    const eog = jacobyApplied
        ? { ...eogStatus, isGammon: false, isBackgammon: false }
        : eogStatus

    return {
        eogStatus: eog,
        stake: eog.calcStake(cubeState.value),
        jacobyApplied,
    }
}

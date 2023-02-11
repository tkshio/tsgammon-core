import { GameConf } from '../GameConf'
import { standardConf } from '../GameConfs'
import { CBState } from './CubeGameState'
import { SGState } from './SingleGameState'
import { GameSetup, toCBState, toSGState } from './utils/GameSetup'

/**
 * キューブありのゲームの局面を表す
 */
export type BGState = {
    cbState: CBState
    sgState: SGState
}

/**
 * 指定された項目から、BGStateオブジェクトを生成する
 * @param gameState
 * @param gameConf
 * @returns
 */
export function toState(
    gameState: GameSetup = {},
    gameConf: GameConf = standardConf
): BGState {
    const cbState: CBState = toCBState(gameState)
    const sgState: SGState = toSGState(gameState, gameConf)
    return { cbState, sgState }
}

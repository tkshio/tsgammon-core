import { GameConf, standardConf } from '../GameConf'
import { CBState } from './CubeGameState'
import { SGState } from './SingleGameState'
import { GameSetup, toCBState, toSGState } from './utils/GameSetup'

export type BGState = {
    cbState: CBState
    sgState: SGState
}

export function toState(
    gameState: GameSetup = {},
    gameConf: GameConf = standardConf
): BGState {
    const cbState: CBState = toCBState(gameState)
    const sgState: SGState = toSGState(gameState, gameConf)
    return { cbState, sgState }
}

import { CBState } from './CubeGameState'
import { SGState } from './SingleGameState'
import { GameSetup, toCBState, toSGState } from './utils/GameSetup'

export type BGState = {
    cbState: CBState
    sgState: SGState
}

export function toState(gameState: GameSetup = {}): BGState {
    const cbState: CBState = toCBState(gameState)
    const sgState: SGState = toSGState(gameState)
    return { cbState, sgState }
}

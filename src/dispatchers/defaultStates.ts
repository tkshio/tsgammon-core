import { boardState } from '../BoardState'
import { cube } from '../CubeState'
import { GameConf, standardConf } from '../GameConf'
import { cbOpening } from './CubeGameState'
import { openingState } from './SingleGameState'

export function defaultBGState(gameConf: GameConf = standardConf) {
    return {
        cbState: cbOpening(cube(1)),
        sgState: defaultSGState(gameConf),
    }
}

export function defaultSGState(gameConf: GameConf = standardConf) {
    return openingState(boardState(gameConf.initialPos))
}

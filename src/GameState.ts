import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBToRoll,
} from './dispatchers/CubeGameState'
import { RSNone, RSOffered } from './dispatchers/ResignState'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGToRoll,
} from './dispatchers/SingleGameState'

export type GameState = GSInit | GSOpening | GSInPlay | GSEoG

type _GameState = {
    //
}

export type GSInit = _GameState & {
    tag: 'GSInit'
}

export type GSOpening = _GameState & {
    tag: 'GSOpening'
    rsState: RSNone
    cbState: CBOpening
    sgState: SGOpening
}
export type GSInPlay = _GameState & {
    tag: 'GSInPlay'
    rsState: RSNone | RSOffered
    cbState: CBAction | CBResponse | CBToRoll | CBInPlay
    sgState: SGInPlay | SGToRoll
}
export type GSEoG = _GameState & {
    cbState: CBEoG
    sgState: SGToRoll | SGEoG
    tag: 'GSEoG'
    isEoM: boolean
    isWonByResign: boolean
}

import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBToRoll,
} from './CubeGameState'
import { SGEoG, SGInPlay, SGOpening, SGToRoll } from './SingleGameState'

export type GameState = GSInit | GSOpening | GSInPlay | GSEoG

type _GameState = {
    isCrawford: boolean
}

export type GSInit = _GameState & {
    tag: 'GSInit'
    isCrawford: false
}

export type GSOpening = _GameState & {
    tag: 'GSOpening'
    cbState: CBOpening
    sgState: SGOpening
}
export type GSInPlay = _GameState & {
    tag: 'GSInPlay'
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

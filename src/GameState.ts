import { CubeState } from './CubeState'
import { Dice } from './Dices'
import { ResignOffer } from './ResignOffer'

export type GameState = GSOpening | GSInPlay | GSEoG

type _GameState = {
    cubeState: CubeState
}

export type GSOpening = _GameState & {
    tag: 'GSOpening'
}

export type GSInPlay = _GameState & {
    tag: 'GSInPlay'
    isResignOffered: boolean
    isDoubleOffered: boolean
    offer?: ResignOffer
    dices?: Dice[]
    isRed: boolean
}

export type GSEoG = _GameState & {
    tag: 'GSEoG'
    isWonByResign: boolean
    isWonByPass: boolean
}

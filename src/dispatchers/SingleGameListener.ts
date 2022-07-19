import { SGEoG, SGInPlay, SGOpening, SGToRoll } from './SingleGameState'

export type SingleGameListener = {
    onGameStarted: () => void
    onOpeningCheckerPlayStarted: (nextState: SGInPlay) => void
    onCheckerPlayStarted: (nextState: SGInPlay) => void
    onRerollOpening: (nextState: SGOpening) => void
    onAwaitRoll: (nextState: SGToRoll, lastState: SGInPlay) => void
    onEndOfGame: (nextState: SGEoG, lastState?: SGInPlay) => void
}

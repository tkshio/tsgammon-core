import { SingleGameListener } from './SingleGameListener'
import { SGInPlay, SGOpening, SGToRoll } from './SingleGameState'

export type SingleGameEventHandler = {
    onStartGame: () => void

    onCommit: (sgState: SGInPlay) => void
    onRoll: (sgState: SGToRoll) => void
    onRollOpening: (sgState: SGOpening) => void
}

export type SingleGameEventHandlerExtensible = SingleGameEventHandler & {
    addListeners: (
        ...sgListeners: Partial<SingleGameListener>[]
    ) => SingleGameEventHandlerExtensible
}

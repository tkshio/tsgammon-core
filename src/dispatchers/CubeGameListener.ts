import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBResponse,
    CBToRoll,
} from './CubeGameState'

export type CubeGameListener = {
    onCubeGameStarted: () => void

    onAwaitCubeAction: (nextState: CBAction | CBToRoll) => void
    onCubeActionStarted: (nextState: CBAction) => void
    onCubeActionSkipped: (nextState: CBToRoll) => void
    onAwaitCheckerPlay: (nextState: CBInPlay) => void

    onDoubled: (nextState: CBResponse, lastState: CBAction) => void
    onDoubleAccepted: (nextState: CBToRoll, lastState: CBResponse) => void
    onPassed: (lastState: CBResponse, isRedWon: boolean) => void
    onEndOfCubeGame: (nextState: CBEoG) => void
}

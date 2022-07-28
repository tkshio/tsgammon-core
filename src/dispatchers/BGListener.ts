import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBToRoll,
} from './CubeGameState'
import { SGInPlay, SGOpening, SGState, SGToRoll } from './SingleGameState'

// BGEventHandlerの結果として呼ばれる処理（すなわち、
// BGEventHandlerに処理を追加するためのインターフェース）

export type BGListener = {
    onBGGameStarted: () => void
    onBGOpeningRerolled: (bgState: {
        cbState: CBOpening
        sgState: SGOpening
    }) => void
    onAwaitCubeAction: (bgState: {
        cbState: CBAction | CBToRoll
        sgState: SGToRoll
    }) => void
    onCubeActionStarted: (bgState: {
        cbState: CBAction
        sgState: SGToRoll
    }) => void
    onCubeActionSkipped: (bgState: {
        cbState: CBToRoll
        sgState: SGToRoll
    }) => void
    onDoubled: (
        bgState: { cbState: CBResponse; sgState: SGToRoll },
        lastState: CBAction
    ) => void
    onDoubleAccepted: (
        bgState: { cbState: CBToRoll; sgState: SGToRoll },
        lastState: CBResponse
    ) => void
    onPassed: (
        bgState: { cbState: CBResponse; sgState: SGToRoll },
        isRedWon: boolean
    ) => void
    onAwaitCheckerPlay: (bgState: {
        cbState: CBInPlay
        sgState: SGInPlay
    }) => void
    onCommitted: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => void
    onEndOfBGGame: (bgState: { cbState: CBEoG; sgState: SGState }) => void
}

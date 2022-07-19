import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBResponse,
    CBToRoll,
} from './CubeGameState'
import { SGInPlay, SGState, SGToRoll } from './SingleGameState'

// BGEventHandlerの結果として呼ばれる処理（すなわち、
// BGEventHandlerに処理を追加するためのインターフェース）

export type BGListener = {
    onBGGameStarted: () => void
    onAwaitCubeAction: (
        bgState: { cbState: CBAction | CBToRoll; sgState: SGToRoll },
        lastState: { cbState: CBInPlay; sgState: SGInPlay }
    ) => void
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
    onAwaitCheckerPlay: (bgState: {
        cbState: CBInPlay
        sgState: SGInPlay
    }) => void
    onEndOfBGGame: (bgState: { cbState: CBEoG; sgState: SGState }) => void
}

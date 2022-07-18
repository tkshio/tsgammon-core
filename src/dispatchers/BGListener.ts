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
    onStartCubeGame: () => void
    onAwaitCubeAction: (
        bgState: { cbState: CBAction | CBToRoll; sgState: SGToRoll },
        lastState: { cbState: CBInPlay; sgState: SGInPlay }
    ) => void
    onStartCubeAction: (bgState: {
        cbState: CBAction
        sgState: SGToRoll
    }) => void
    onSkipCubeAction: (bgState: {
        cbState: CBToRoll
        sgState: SGToRoll
    }) => void
    onDouble: (
        bgState: { cbState: CBResponse; sgState: SGToRoll },
        lastState: CBAction
    ) => void
    onTake: (
        bgState: { cbState: CBToRoll; sgState: SGToRoll },
        lastState: CBResponse
    ) => void
    onAwaitCheckerPlay: (bgState: {
        cbState: CBInPlay
        sgState: SGInPlay
    }) => void
    onEndOfCubeGame: (bgState: { cbState: CBEoG; sgState: SGState }) => void
}

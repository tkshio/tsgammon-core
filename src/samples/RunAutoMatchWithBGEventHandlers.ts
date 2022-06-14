import {
    BGEventHandlers,
    asSGEventHandlers,
} from '../dispatchers/BGEventHandlers'
import { BGState } from '../dispatchers/BGState'
import { cubefulGameEventHandlers } from '../dispatchers/cubefulGameEventHandlers'
import { CBState } from '../dispatchers/CubeGameState'
import { defaultBGState } from '../dispatchers/defaultStates'
import { rollListeners } from '../dispatchers/RollDispatcher'
import { SGState } from '../dispatchers/SingleGameState'
import { toCBState, toSGState } from '../dispatchers/utils/GameSetup'
import { simpleNNEngine } from '../engines/SimpleNNGammon'
import { score } from '../Score'
import { formatStake } from '../utils/formatStake'
import { doCheckerPlay } from './doCheckerPlay'

const engine = simpleNNEngine

function doPlay(bgState: BGState, eventHandlers: BGEventHandlers) {
    const { cbState, sgState } = bgState
    switch (cbState.tag) {
        case 'CBOpening':
        case 'CBInPlay':
        case 'CBToRoll':
            doCheckerPlay(
                simpleNNEngine,
                sgState,
                asSGEventHandlers(cbState, eventHandlers)
            )
            break

        case 'CBAction':
            if (sgState.tag === 'SGToRoll') {
                if (
                    engine.cubeAction(sgState.boardState, cbState.cubeState)
                        .isDouble
                ) {
                    eventHandlers.onDouble({ cbState, sgState })
                } else {
                    eventHandlers.onRoll({ cbState, sgState })
                }
            } else {
                throw new Error(
                    'Unexpected sgState for cube action: sgState=' + sgState.tag
                )
            }
            break

        case 'CBResponse':
            if (sgState.tag === 'SGToRoll') {
                if (
                    engine.cubeResponse(sgState.boardState, cbState.cubeState)
                        .isTake
                ) {
                    eventHandlers.onTake({ cbState, sgState })
                } else {
                    eventHandlers.onPass({ cbState, sgState })
                }
            } else {
                throw new Error(
                    'Unexpected sgState for cube response: sgState=' +
                        sgState.tag
                )
            }
            break

        case 'CBEoG':
            break
    }
}
function run() {
    const stakeConf = { jacobyRule: false }
    let gameScore = score()
    const gState = { cb: toCBState(), sg: toSGState() }

    const setSGState = (state: SGState) => {
        gState.sg = state
    }
    const setCBState = (state: CBState) => {
        gState.cb = state
    }
    const isCrawford = false
    const { handlers } = cubefulGameEventHandlers(
        isCrawford,
        defaultBGState(),
        setSGState,
        setCBState,
        rollListeners()
    )

    let cbState = gState.cb
    let sgState = gState.sg

    while (cbState.tag !== 'CBEoG') {
        doPlay({ cbState, sgState }, handlers)

        cbState = gState.cb
        sgState = gState.sg
    }

    const stake = cbState.calcStake(stakeConf).stake
    gameScore = gameScore.add(stake)
    console.log(formatStake(stake, cbState.eogStatus))

    console.log(
        `Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`
    )
}
run()
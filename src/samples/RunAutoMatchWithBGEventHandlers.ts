import {
    asSGEventHandler,
    BGEventHandler,
    setBGStateListener,
} from '../dispatchers/BGEventHandler'
import { BGState } from '../dispatchers/BGState'
import { buildBGEventHandler } from '../dispatchers/buildBGEventHandler'
import { defaultBGState } from '../dispatchers/defaultStates'
import { rollListener } from '../dispatchers/RollDispatcher'
import { toCBState, toSGState } from '../dispatchers/utils/GameSetup'
import { simpleNNEngine } from '../engines/SimpleNNGammon'
import { standardConf } from '../GameConf'
import { score } from '../Score'
import { formatStake } from '../utils/formatStake'
import { doCheckerPlay } from './doCheckerPlay'

const engine = simpleNNEngine

function doPlay(bgState: BGState, eventHandlers: BGEventHandler) {
    const { cbState, sgState } = bgState
    switch (cbState.tag) {
        case 'CBOpening':
        case 'CBInPlay':
        case 'CBToRoll':
            doCheckerPlay(
                simpleNNEngine,
                sgState,
                asSGEventHandler(cbState, eventHandlers)
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
    const gameConf = { ...standardConf, jacobyRule: false }
    let gameScore = score()
    const gState = { cb: toCBState(), sg: toSGState() }

    const setBGState = (state: BGState) => {
        gState.cb = state.cbState
        gState.sg = state.sgState
    }
    const handlers = buildBGEventHandler(
        () => false,
        rollListener(),
        setBGStateListener(defaultBGState(gameConf), setBGState)
    )

    let cbState = gState.cb
    let sgState = gState.sg

    while (cbState.tag !== 'CBEoG') {
        doPlay({ cbState, sgState }, handlers)

        cbState = gState.cb
        sgState = gState.sg
    }

    const stake = cbState.calcStake(gameConf).stake
    gameScore = gameScore.add(stake)
    console.log(formatStake(stake, cbState.eogStatus))

    console.log(
        `Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`
    )
}
run()

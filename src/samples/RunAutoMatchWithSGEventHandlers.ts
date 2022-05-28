import { defaultSGState } from '../dispatchers/defaultStates'
import { buildSGEventHandlers } from '../dispatchers/SingleGameEventHandlers'
import { SGState } from '../dispatchers/SingleGameState'
import { toSGState } from '../dispatchers/utils/GameSetup'
import { simpleNNEngine } from '../engines/SimpleNNGammon'
import { standardConf } from '../GameConf'
import { score } from '../Score'
import { randomDiceSource } from '../utils/DiceSource'
import { formatStake } from '../utils/formatStake'
import { doCheckerPlay } from './doCheckerPlay'

export const diceSource = randomDiceSource

function run() {
    const gState: { sg: SGState } = { sg: toSGState() }
    let gameScore = score()
    const setSGState = (state: SGState) => {
        gState.sg = state
    }
    const { handlers } = buildSGEventHandlers(
        defaultSGState(standardConf),
        setSGState
    )

    let sgState = gState.sg

    while (sgState.tag !== 'SGEoG') {
        doCheckerPlay(simpleNNEngine, sgState, handlers)
        if (sgState.tag === 'SGToRoll') {
            // console.log(formatPly(sgState.lastPly))
        }
        sgState = gState.sg
    }
    // console.log(formatPly(sgState.lastState().curPly))
    gameScore = gameScore.add(sgState.stake)
    console.log(formatStake(sgState.stake, sgState.eogStatus))

    console.log(
        `Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`
    )
}

run()

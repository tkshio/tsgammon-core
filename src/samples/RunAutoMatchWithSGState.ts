import { SGState } from '../dispatchers/SingleGameState'
import { toSGState } from '../dispatchers/utils/GameSetup'
import { simpleNNEngine } from '../engines/SimpleNNGammon'
import { score } from '../Score'
import { randomDiceSource } from '../utils/DiceSource'
import { formatStake } from '../utils/formatStake'

const diceSource = randomDiceSource
const engine = simpleNNEngine

function doPlay(sgState: SGState): SGState {
    switch (sgState.tag) {
        case 'SGOpening': {
            const openingRoll = diceSource.roll()
            return sgState.doOpening(openingRoll)
        }
        case 'SGInPlay': {
            const curNode = sgState.boardStateNode
            const nextNode = engine.checkerPlay(curNode)
            return sgState.doCheckerPlayCommit(nextNode, curNode)
        }
        case 'SGToRoll': {
            const roll = diceSource.roll()
            return sgState.doRoll(roll)
        }
        case 'SGEoG':
            return sgState
    }
}

function run() {
    let sgState = toSGState()
    let gameScore = score()
    while (sgState.tag !== 'SGEoG') {
        sgState = doPlay(sgState)
        if (sgState.tag === 'SGToRoll') {
            // console.log(formatPly(sgState.lastPly))
        }
    }
    // console.log(formatPly(sgState.lastState().curPly))
    gameScore = gameScore.add(sgState.stake)
    console.log(formatStake(sgState.stake, sgState.eogStatus))
    sgState = toSGState()

    console.log(
        `Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`
    )
}

run()

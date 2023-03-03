import { BoardState } from '../BoardState'
import {
    BoardStateNodeBuilder,
    buildBoardStateNodeBuilder,
} from '../BoardStateNodeBuilders'
import { DiceRoll } from '../Dices'
import { RuleSet } from '../rules/RuleSet'
import { standardRuleSet } from '../rules/standardRuleSet'
import { sugorokuRuleSet } from '../rules/sugorokuRuleSet'
import { SGTransition } from './SGTransition'
import {
    inPlayState,
    openingState,
    SGEoG,
    SGInPlay,
    SGOpening,
    SGToRoll,
    toEoGState,
    toToRollState,
    toToRollStateAgain,
} from './SingleGameState'

export function sgTransition(ruleSet: RuleSet): SGTransition {
    const boardStateNodeFunc = buildBoardStateNodeBuilder(ruleSet)
    return {
        doOpening: doOpening(boardStateNodeFunc),
        doRoll: doRoll(boardStateNodeFunc),
        doCheckerPlayCommit,
        ruleSet,
    }
}
export const standardTransition: SGTransition = sgTransition(standardRuleSet)
export const sugorokuTransition: SGTransition = sgTransition(sugorokuRuleSet)

export const sugorokuRTransition: SGTransition = {
    ...sugorokuTransition,
    doCheckerPlayCommit: doCheckerPlayCommitSugoroku,
}

function doCheckerPlayCommitSugoroku(state: SGInPlay): SGToRoll | SGEoG {
    if (state.boardStateNode.eogStatus.isEndOfGame) {
        return toEoGState(state)
    } else {
        const dices = state.rootNode.dices
        if (dices.length === 2 && dices[0].pip === dices[1].pip) {
            return toToRollStateAgain(state)
        } else {
            return toToRollState(state)
        }
    }
}

function doOpening(
    boardStateNodeFunc: BoardStateNodeBuilder
): (state: SGOpening, openingRoll: DiceRoll) => SGInPlay | SGOpening {
    return (state, openingRoll) => {
        const boardState = state.boardState
        if (needReRoll(openingRoll)) {
            // 同じ目なら、再度Openingへ遷移
            return openingState(boardState, openingRoll)
        } else {
            // そうでなければ、オープニングロールのダイス目を引数として、大きい目を出した方のInPlayへ遷移
            const isRed = isRedPlayerFirst(openingRoll)
            const board = boardToPlay(boardState, isRed)
            const node = boardStateNodeFunc(board, openingRoll)

            return inPlayState(node, isRed)
        }

        function needReRoll(openingRoll: DiceRoll) {
            return openingRoll.dice1 === openingRoll.dice2
        }

        function isRedPlayerFirst(openingRoll: DiceRoll) {
            return openingRoll.dice1 > openingRoll.dice2
        }

        function boardToPlay(board: BoardState, isRed: boolean) {
            return isRed ? board.revert() : board
        }
    }
}

function doRoll(
    boardStateNodeFunc: BoardStateNodeBuilder
): (state: SGToRoll, dices: DiceRoll) => SGInPlay {
    return (state, dices) => {
        const node = boardStateNodeFunc(state.boardState, dices)
        return inPlayState(node, state.isRed)
    }
}

function doCheckerPlayCommit(state: SGInPlay): SGToRoll | SGEoG {
    return state.boardStateNode.eogStatus.isEndOfGame
        ? toEoGState(state)
        : toToRollState(state)
}

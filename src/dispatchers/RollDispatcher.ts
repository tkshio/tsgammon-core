import { BoardStateNode } from '../BoardStateNode'
import { DiceRoll } from '../Dices'
import { DiceSource, randomDiceSource } from '../utils/DiceSource'
import { SGEoG, SGInPlay, SGOpening, SGToRoll } from './SingleGameState'

export interface RollDispatcher {
    doRollRequest(rollReq: (dices: DiceRoll) => void): void
}

export interface RollListener {
    onRollRequest: (rollReq: (dices: DiceRoll) => void) => void
}

export type RollReqs = {
    reqs: ((dices: DiceRoll) => void)[]
}

export function rollListeners(
    conf:
        | { isRollHandlerEnabled: false; diceSource: DiceSource }
        | { isRollHandlerEnabled: true; rollListener: RollListener } = {
        isRollHandlerEnabled: false,
        diceSource: randomDiceSource,
    }
): RollListener {
    // diceSourceが指定されている場合は普通にロールを行い、そうでない場合は、listnerに任せる
    // rollListenerはStoriesなどによって自動的に指定される場合があるので、別途フラグを設けている

    return {
        onRollRequest: conf.isRollHandlerEnabled
            ? (rollReq: (dices: DiceRoll) => void): void => {
                  conf.rollListener.onRollRequest(rollReq)
              }
            : async (rollReq: (dices: DiceRoll) => void): Promise<void> => {
                  const roll = await conf.diceSource.roll()
                  rollReq(roll)
              },
    }
}

export type SingleGameDispatcherWithRD = {
    doOpeningRoll: (state: SGOpening) => void
    doCommitCheckerPlay: (
        state: SGInPlay,
        curBoardState: BoardStateNode
    ) => SGToRoll | SGEoG
    doRoll: (state: SGToRoll) => void
}

export function rollDispatcher(listener: RollListener): RollDispatcher {
    return {
        doRollRequest: (rollReq: (dices: DiceRoll) => void): void => {
            listener.onRollRequest(rollReq)
        },
    }
}

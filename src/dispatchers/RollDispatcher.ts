import { DiceRoll } from '../Dices'
import { DiceSource, randomDiceSource } from '../utils/DiceSource'
import { SingleGameDispatcher } from './SingleGameDispatcher'
import { SingleGameListener } from './SingleGameListener'
import { SGOpening, SGToRoll } from './SingleGameState'

export interface RollDispatcher {
    doRollRequest(rollReq: (dices: DiceRoll) => void): void
}

export interface RollListener {
    onRollRequest: (rollReq: (dices: DiceRoll) => void) => void
}

export type RollReqs = {
    reqs: ((dices: DiceRoll) => void)[]
}

export function rollListener(
    conf: {
        onRollRequest?: (rollReq: (dices: DiceRoll) => void) => void
        diceSource?: DiceSource
    } = {}
): RollListener {
    //rollListnerの指定があればそちらに任せ、そうでなければDiceSourceを適宜補完して処理する
    const { onRollRequest, diceSource = randomDiceSource } = conf
    return {
        onRollRequest:
            onRollRequest !== undefined
                ? (rollReq: (dices: DiceRoll) => void): void => {
                      onRollRequest(rollReq)
                  }
                : async (rollReq: (dices: DiceRoll) => void): Promise<void> => {
                      const roll = await Promise.resolve(diceSource.roll())
                      rollReq(roll)
                  },
    }
}

export type SingleGameDispatcherWithRL = Omit<
    SingleGameDispatcher,
    'doRoll' | 'doOpeningRoll'
> & {
    doRoll: (
        state: SGToRoll
    ) => (listener: Pick<SingleGameListener, 'onCheckerPlayStarted'>) => void
    doOpeningRoll: (
        state: SGOpening
    ) => (
        listener: Pick<
            SingleGameListener,
            'onOpeningCheckerPlayStarted' | 'onRerollOpening'
        >
    ) => void
}

export function withRL(
    singleGameDispatcher: SingleGameDispatcher,
    rollListener: RollListener
): SingleGameDispatcherWithRL {
    return {
        ...singleGameDispatcher,
        doRoll: (state: SGToRoll) => {
            return (
                listener: Pick<SingleGameListener, 'onCheckerPlayStarted'>
            ) => {
                rollListener.onRollRequest((dices: DiceRoll) => {
                    const result = singleGameDispatcher.doRoll(state, dices)
                    result(listener)
                })
            }
        },
        doOpeningRoll: (state: SGOpening) => {
            return (
                listener: Pick<
                    SingleGameListener,
                    'onOpeningCheckerPlayStarted' | 'onRerollOpening'
                >
            ) => {
                rollListener.onRollRequest((dices: DiceRoll) => {
                    const result = singleGameDispatcher.doOpeningRoll(
                        state,
                        dices
                    )
                    result(listener)
                })
            }
        },
    }
}

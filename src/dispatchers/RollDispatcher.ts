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
                  const roll = await Promise.resolve(conf.diceSource.roll())
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
    ) => (
        listener: Partial<Pick<SingleGameListener, 'onCheckerPlayStarted'>>
    ) => void
    doOpeningRoll: (
        state: SGOpening
    ) => (
        listener: Partial<
            Pick<
                SingleGameListener,
                'onOpeningCheckerPlayStarted' | 'onRerollOpening'
            >
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
                listener: Partial<
                    Pick<SingleGameListener, 'onCheckerPlayStarted'>
                >
            ) => {
                rollListener.onRollRequest((dices: DiceRoll) => {
                    const result = singleGameDispatcher.doRoll(state, dices)
                    result(listener)
                })
            }
        },
        doOpeningRoll: (state: SGOpening) => {
            return (
                listener: Partial<
                    Pick<
                        SingleGameListener,
                        'onOpeningCheckerPlayStarted' | 'onRerollOpening'
                    >
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

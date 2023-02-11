import { DiceRoll } from '../Dices'
import { RuleSet } from '../rules/RuleSet'
import { SGEoG, SGInPlay, SGOpening, SGToRoll } from './SingleGameState'

export type SGTransition = {
    doOpening: (state: SGOpening, dices: DiceRoll) => SGInPlay | SGOpening
    doRoll: (state: SGToRoll, dices: DiceRoll) => SGInPlay
    doCheckerPlayCommit: (state: SGInPlay) => SGToRoll | SGEoG
    ruleSet: RuleSet
}

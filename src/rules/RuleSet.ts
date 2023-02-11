import { BoardState } from '../BoardState'
import { DicePip } from '../Dices'
import { EOGStatus } from '../EOGStatus'
import { Move } from '../Move'

export type RuleSet = {
    isEndOfGame: (board: BoardState) => EOGStatus
    isLegalMove: (
        board: BoardState,
        index: number,
        dicePip: DicePip
    ) => { isLegal: true; move: Move } | { isLegal: false }
    countForDoublet: number
}

import { BoardState } from '../BoardState'
import { eog, EOGStatus } from '../EOGStatus'
import { RuleSet } from './RuleSet'
import { isLegalMove } from './standardRuleSet_isLegalMove'

export const standardRuleSet: RuleSet = {
    isEndOfGame: isEoGStandard,
    countForDoublet: 4,
    isLegalMove,
}

function isEoGStandard(board: BoardState): EOGStatus {
    const isEndOfGame = board.pieceCount === 0
    const isGammon = isEndOfGame && board.opponentBornOff === 0
    const isBackgammon = isGammon && isBackgammonAlso()
    return eog({
        isEndOfGame,
        isGammon,
        isBackgammon,
    })

    function isBackgammonAlso() {
        // 自分のinnerPosとバーの間が、相手のアウターになる
        const outerPos = board.points.length - board.innerPos // 7 = 26 - 19
        const opponentOuterAndBar = [...Array(outerPos)].map(
            (_, index) => index + board.innerPos
        )
        return (
            opponentOuterAndBar
                .map((pos) => board.points[pos])
                .filter((c) => c < 0)
                .reduce((m, n) => m + n, 0) < 0
        )
    }
}

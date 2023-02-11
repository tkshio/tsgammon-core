import { BoardState } from '../BoardState'
import { EOGStatus, eog } from '../EOGStatus'
import { standardRuleSet } from './standardRuleSet'

export const sugorokuRuleSet = {
    ...standardRuleSet,
    countForDoublet: 2,
    isEndOfGame: isEoGHonsugoroku,
}

/**
 * 駒が全てインナーに入ったら勝利、ただし、相手がヒットできる可能性があれば続行
 * その場合、未使用の目がある限り、ベアオフするかムーブするかしないといけない
 */
function isEoGHonsugoroku(board: BoardState): EOGStatus {
    // ベアオフ可能 = 全ての駒がインナーに入っていなければ続行
    // TODO: 多分全てのコマをあげてしまうと不正な判定になる
    if (!isBearable(board)) {
        return eog({ isEndOfGame: false })
    }

    // 相手にヒットの可能性がある場合は続行
    if (board.opponentLastPiecePos >= board.innerPos) {
        for (let i = board.innerPos; i <= board.opponentLastPiecePos; i++) {
            if (board.piecesAt(i) === 1) {
                return eog({ isEndOfGame: false })
            }
        }
    }
    // TODO: gammon, backgammon
    return eog({ isEndOfGame: true })
}

// 上がれるかどうかの更新が必要なのは、上がりでない時だけ
function isBearable(boardState: BoardState): boolean {
    return boardState.innerPos <= boardState.lastPiecePos
}

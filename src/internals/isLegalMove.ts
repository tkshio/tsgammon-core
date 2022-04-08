import { BoardState } from '../BoardState'
import { Move } from '../Move'

/**
 * バックギャモンの標準的なルールに従い、ある駒を動かす手が可能かどうかを判定する
 *
 * @param board 盤面
 * @param pos 動かす駒の位置
 * @param dicePip 使用する目
 * @returns 手の可否と、可能な場合はそれを格納した{@link Move}オブジェクト
 */
export function isLegalMove(
    board: BoardState,
    pos: number,
    dicePip: number
): { isLegal: true; move: Move } | { isLegal: false } {
    // 始点に駒がなくては動かせない
    const pieces = board.piecesAt(pos)
    if (pieces <= 0) {
        return { isLegal: false }
    }

    const barPos = 0
    // オンザバーでは、バー上の駒以外動かせない
    if (board.piecesAt(barPos) > 0 && pos !== barPos) {
        return { isLegal: false }
    }

    const moveTo = pos + dicePip
    // ベアオフでない場合、行先がブロックされていなければ、合法なムーブ
    if (0 < moveTo && moveTo < board.bearOffPos) {
        const opponent = -board.piecesAt(moveTo)
        return opponent < 2
            ? {
                  isLegal: true,
                  move: {
                      from: pos,
                      to: pos + dicePip,
                      pip: dicePip,
                      isHit: opponent === 1,
                      isBearOff: false,
                      isOverrun: false,
                  },
              }
            : { isLegal: false }
    }

    // ベアオフする条件は満たされているか
    if (!board.isBearable()) {
        return { isLegal: false }
    }

    const bearOffPos = board.bearOffPos

    // ちょうどで上がるか、そうでなければ最後尾からでなくてはいけない
    return moveTo === bearOffPos || pos === board.lastPiecePos()
        ? {
              isLegal: true,
              move: {
                  from: pos,
                  to: pos + dicePip,
                  pip: dicePip,
                  isHit: false,
                  isBearOff: true,
                  isOverrun: moveTo > bearOffPos,
              },
          }
        : { isLegal: false }
}

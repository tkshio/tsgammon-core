import { BoardState } from '../BoardState'
import { BoardStateNode, NO_MOVE } from '../BoardStateNode'
import { Dice, DicePip, dices } from '../Dices'
import { Move } from '../Move'
import { applyDicePipToPoints } from './applyDicePipToPoints'
import { buildNodeForEoG, leaveNodeBuilder, NodeBuilder } from './NodeBuilder'

/**
 * ゾロ目に対して、バックギャモンのルールに基づいて可能な手を列挙し、BoardStateNodeとして返す
 * @param board 盤面
 * @param dicePip ダイスの目
 * @returns
 */
export function buildNodesForDoublet(
    board: BoardState,
    dicePip: DicePip
): BoardStateNode {
    const unusedDices = dices(dicePip, dicePip, dicePip, dicePip)
    const [node] = buildNodesForDoubletRec(
        board,
        unusedDices,
        dicePip,
        [],
        [],
        false
    )
    return node
}

/**
 * 未使用のダイスが残り2個になるまで再帰しつつ、可能な局面のツリーを構築する
 *
 * @param board         盤面
 * @param unusedDices   未使用のダイス
 * @param pip           適用しようとしている目
 * @param usedDices     使用済みのダイス
 * @param lastMoves     この局面に至るまでの手
 * @param isAlreadyRedundant すでに冗長かどうか。ゾロ目の場合、冗長なノードの下位のムーブは全て冗長となる。
 * @returns
 */
function buildNodesForDoubletRec(
    board: BoardState,
    unusedDices: Dice[],
    pip: DicePip,
    usedDices: Dice[],
    lastMoves: Move[],
    isAlreadyRedundant: boolean
): [BoardStateNode, number] {
    // 子ノードに格納する内容を整えて、子ノードのビルダーを準備する

    // ダイスは1つ使用済みになる
    const dicesUsedUp = usedDices.concat({ pip, used: true })

    // 未使用ダイスが残り2個なら末端（とその親）ノードの生成、そうでなければ再帰
    const nodeBuilder: NodeBuilder =
        unusedDices.length === 2
            ? leaveNodesAndParentBuilder(
                  pip,
                  dicesUsedUp,
                  lastMoves,
                  isAlreadyRedundant
              )
            : recursiveNodeBuilder(
                  unusedDices,
                  pip,
                  dicesUsedUp,
                  lastMoves,
                  isAlreadyRedundant
              )

    // 各ポイントについて、子ノードを構築する
    const [major, marked] = applyDicePipToPoints(
        board,
        pip,
        nodeBuilder,
        unusedDices.length
    )

    // 子ノードで使えなかったダイスの数＝markedを、使用不可としてマークする
    const markAfter = unusedDices.length - marked
    const dices = usedDices.concat(
        Array.from({ length: unusedDices.length }, (_, idx) => {
            return idx < marked ? { pip, used: true } : { pip, used: false }
        })
    )
    return [
        {
            hasValue: true,
            dices,
            board: board,
            majorFirst: major,
            minorFirst: () => NO_MOVE,
            lastMoves: () => lastMoves,
            isRedundant: false,
            isCommitable: markAfter === 0,
        },
        marked,
    ]
}

// 最後の二つになるまでは、未使用ダイスを1つず減らしながら再帰するだけ
function recursiveNodeBuilder(
    unusedDices: Dice[],
    pip: DicePip,
    usedDices: Dice[],
    lastMoves: Move[],
    isAlreadyRedundant: boolean
): NodeBuilder {
    return (board: BoardState, move: Move) => {
        return buildNodesForDoubletRec(
            board,
            unusedDices.slice(1),
            pip,
            usedDices,
            lastMoves.concat(move),
            isAlreadyRedundant || lastMoveIsRedundant(lastMoves, move)
        )
    }
}

// 最後に適用した手が、それまでに適用した手より手前の駒を動かす場合は、冗長なムーブ
function lastMoveIsRedundant(lastMoves: Move[], move: Move): boolean {
    return (
        lastMoves.length > 0 && move.from < lastMoves[lastMoves.length - 1].from
    )
}

// buildNodes()で構築するツリーの、最末端ノードを構築する
// すなわち、最後の一つのダイスを各ポイントに適用した結果を返す
function leaveNodesAndParentBuilder(
    pip: DicePip,
    usedDices: Dice[],
    lastMoves: Move[],
    isAlreadyRedundant: boolean
): NodeBuilder {
    return (board: BoardState, moveBeforeFinal: Move) => {
        const lastMovesForLeave = lastMoves.concat(moveBeforeFinal)
        const isEog = board.eogStatus().isEndOfGame
        if (isEog) {
            // ゾロ目の場合、ダイスの入れ替えを気にする必要はないので、
            // marked=1とすることで、EoGに達して余ったダイスは使用済み扱いになる。
            // （よって、ロール直後は最後の一つが使えない状態としてマークされる）
            return buildNodeForEoG(
                board,
                usedDices.concat({ pip, used: true }),
                lastMovesForLeave,
                1
            )
        }

        // 最後のpipを適用して末端ノードを生成する
        const isAlreadyRedundantForLeave =
            isAlreadyRedundant ||
            lastMoveIsRedundant(lastMoves, moveBeforeFinal)
        const nodeBuilder = leaveNodeBuilder(
            usedDices,
            pip,
            (finalMove) => lastMovesForLeave.concat(finalMove),
            (finalMove) =>
                isAlreadyRedundantForLeave ||
                lastMoveIsRedundant(lastMovesForLeave, finalMove)
        )
        const [major, unusedDices] = applyDicePipToPoints(
            board,
            pip,
            nodeBuilder,
            1
        )

        //　末端ノードの親ノードを生成して返す
        return [
            {
                hasValue: true,
                dices: usedDices.concat([{ pip, used: unusedDices === 1 }]),
                board: board,
                majorFirst: major,
                minorFirst: () => NO_MOVE,
                lastMoves: () => lastMovesForLeave,
                isRedundant: false,
                isCommitable: unusedDices === 1,
            },
            unusedDices,
        ]
    }
}

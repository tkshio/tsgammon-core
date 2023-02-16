import { BoardState } from '../BoardState'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'
import { DicePip } from '../Dices'
import { Move } from '../Move'
import {
    InternalBoardStateNodeBuilders,
    recursiveNodeBuilder,
    TmpNode,
} from './internalBoardStateNodeBuilders'

export function buildDoubletNodeBuilder(
    internalNodeBuilders: InternalBoardStateNodeBuilders
): (
    board: BoardState,
    dicePip: DicePip,
    countForDoublet: number
) => BoardStateNodeRoot {
    const nodeBuilder = recursiveNodeBuilder(
        addDeduplicator(internalNodeBuilders)
    )
    return (board: BoardState, dicePip: DicePip, countForDoublet: number) => {
        const root = nodeBuilder(
            board,
            Array(countForDoublet).fill(dicePip)
        ).node
        return { root: root, dices: root.dices, hasValue: true, isRoot: true }
    }
}

// ゾロ目の場合の重複排除は、後ろの駒を先に動かす手を重複とみなす
function addDeduplicator(
    nodeBuilders: InternalBoardStateNodeBuilders
): InternalBoardStateNodeBuilders {
    return {
        ...nodeBuilders,
        ifLeafThenBuild: (node: TmpNode) => {
            const maybeNode = nodeBuilders.ifLeafThenBuild(node)
            if (maybeNode.hasValue) {
                const value = maybeNode.value
                const isRedundant =
                    node.isRedundantAlready ||
                    lastMoveIsRedundant(value.node.lastMoves)

                return {
                    hasValue: true,
                    value: {
                        node: { ...value.node, isRedundant },
                        canUse: value.canUse,
                    },
                }
            } else {
                return maybeNode // {hasValue: false}
            }
        },
        buildChildNodes(parent, recurse) {
            return nodeBuilders.buildChildNodes(
                {
                    ...parent,
                    isRedundantAlready:
                        parent.isRedundantAlready ||
                        lastMoveIsRedundant(parent.lastMoves),
                },
                recurse
            )
        },
    }

    // 最後に適用した手が、それまでに適用した手より手前の駒を動かす場合は、冗長なムーブ
    function lastMoveIsRedundant(lastMoves: Move[]): boolean {
        if (lastMoves.length < 2) {
            return false
        }
        const move = lastMoves[lastMoves.length - 1]
        return move.from < lastMoves[lastMoves.length - 2].from
    }
}

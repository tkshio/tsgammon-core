import { BoardState } from '../BoardState'
import { BoardStateNode, NoMove, NO_MOVE } from '../BoardStateNode'
import { Dice, DicePip } from '../Dices'
import { inGame } from '../EOGStatus'
import { Move } from '../Move'
import { RuleSet } from '../rules/RuleSet'
import {
    buildRecursiveNodeBuilder,
    HasValueOrNot,
    NodeBuilders,
} from './NodeBuilder'

/**
 * BoardStateNodeからなるツリー構築のための、ノード生成関数のセット
 */
export type InternalBoardStateNodeBuilders = NodeBuilders<
    NodeAndDiceUsage,
    TmpNode,
    {
        children: NodeOrNoMove[]
        maxUsage: number
        mayTerm: boolean
    }
>

/**
 * NodeBuilderに生成させるノード、ツリーの構成要素であるBoardStateNodeと、補助的に使用する情報のセットからなる。
 *
 * @param node 生成されたBoardStateNode
 * @param canUse nodeが表す局面において、使用可能なダイスの数
 */
export type NodeAndDiceUsage = { node: BoardStateNode; canUse: number }

/**
 * 子ノードを表す型。合法な手に対応する通常のノードに加え、その手が指せないことを示す定義がある
 *
 * ※ canUse==0なノードは、何らかの合法手を指した結果である、全てのダイスを使い切った局面を示すノードであるのに対し、
 * canUse==-1なノードは、その手がそもそも合法でないことを示すためのノードである。
 */
export type NodeOrNoMove = NodeAndDiceUsage | { node: NoMove; canUse: -1 }

/*
 * NodeBuilderに生成させる、ノード生成の引数として使用する、仮ノードの型
 *
 * @param hasValue 生成時の引数に対して、仮ノードが生成可能ならtrue
 * @param board 局面
 * @param usedDices この局面に到るまでに使用されたダイス
 * @param unusedDices この局面で使用できる(かもしれない)ダイス
 * @param lastMoves この局面に到るまでに適用された手
 * @param isRedundantAlready: trueの場合、この仮ノードから生成されたノードの子ノードも冗長なノードとして扱う
 */
export type TmpNode = {
    hasValue: true
    board: BoardState
    usedDices: Dice[]
    unusedDices: Dice[]
    lastMoves: Move[]
    isRedundantAlready?: boolean
}

/**
 * ルールの定義から、ノードツリー構築のための、末端ノード、中間ノード、子ノードの集合、それぞれの生成関数を生成する
 * @param ruleSet ルールの定義
 * @returns ノード生成関数のセット
 */
export function buildInternalBoardStateNodeBuilders(
    ruleSet: RuleSet
): InternalBoardStateNodeBuilders {
    const { isEndOfGame, isLegalMove } = ruleSet
    return {
        ifLeafThenBuild(tmpNode: TmpNode): HasValueOrNot<NodeAndDiceUsage> {
            const allDicesUsed = tmpNode.unusedDices.length === 0
            const eogStatus = isEndOfGame(tmpNode.board)
            const isLeaf = allDicesUsed || eogStatus.isEndOfGame
            if (!isLeaf) {
                return { hasValue: false, value: undefined as never }
            }

            const { unusedDices, usedDices, board, lastMoves } = tmpNode
            return {
                hasValue: true,
                value: {
                    node: {
                        hasValue: true,
                        dices: usedDices.concat(
                            // unusedDicesが空でない場合（＝途中でEoGに達した場合）、
                            // 未使用のダイスを使用不可としてマークしする
                            unusedDices.map((dice) => ({
                                pip: dice.pip,
                                used: true,
                            }))
                        ),
                        board,
                        majorFirst: () => NO_MOVE,
                        minorFirst: () => NO_MOVE,
                        lastMoves,
                        isRedundant: false,
                        isCommitable: true,
                        eogStatus,
                    },
                    canUse: 0,
                },
            }
        },
        buildBranchNode(
            parentNode: TmpNode,
            childNodes: {
                children: NodeOrNoMove[]
                maxUsage: number
                mayTerm: boolean
            }
        ): NodeAndDiceUsage {
            const { unusedDices, usedDices, board, lastMoves } = parentNode

            // これ以上、可能な手がない＝子ノードが全てNO_MOVE
            const isCommitable = childNodes.maxUsage === -1

            // 子ノードで使用不能のダイスは使用済みとしてマークする
            const dices = usedDices.concat(
                unusedDices.map((dice, index) => ({
                    pip: dice.pip,
                    used: childNodes.maxUsage < index,
                    // [0]はこのノードが使用、[1]...[maxUsage]は子ノードが使用
                }))
            )
            return {
                node: {
                    hasValue: true,
                    dices,
                    board,
                    majorFirst: (pos: number) =>
                        childNodes.children[pos]?.node ?? NO_MOVE,
                    minorFirst: () => NO_MOVE,
                    lastMoves,
                    isRedundant: false, // redundantの判定は後付けなので、一旦false
                    isCommitable,
                    eogStatus: inGame, // eogならleafNodeの生成に遷移するので、常にfalse
                },
                canUse: 1 + childNodes.maxUsage,
            }
        },

        buildChildNodes(
            parent: TmpNode,
            recurse: (tmpNode: TmpNode) => NodeOrNoMove
        ): {
            children: NodeOrNoMove[]
            maxUsage: number
            mayTerm: boolean
        } {
            const { unusedDices, board, lastMoves, isRedundantAlready } = parent

            const [dice, ...unusedDicesAfter] = unusedDices
            const dicesAfter = parent.usedDices.concat({
                pip: dice.pip,
                used: true,
            })
            const dicePip = dice.pip

            // 現局面から、一手進めた局面を生成
            const children: NodeOrNoMove[] = board.points.map((_, index) => {
                // 各ポイントについて、指定のダイス目が使えるかどうか判断する
                const move = isLegalMove(board, index, dicePip)
                // 使えるポイントについては子ノードを生成し、そうでなければNO_MOVEを返す
                if (move.isLegal) {
                    const next: TmpNode = {
                        hasValue: true,
                        usedDices: dicesAfter,
                        unusedDices: unusedDicesAfter,
                        board: board.movePiece(index, dicePip),
                        lastMoves: lastMoves.concat(move.move),
                        isRedundantAlready,
                    }

                    return recurse(next)
                } else {
                    return { node: NO_MOVE, canUse: -1 }
                }
            })

            const { maxUsage, mayTerm } = children
                .map((child) => ({
                    maxUsage: child.canUse,
                    mayTerm: child.node.hasValue
                        ? child.node.eogStatus.isEndOfGame
                        : false,
                }))
                .reduce((prev, cur) => ({
                    maxUsage: Math.max(prev.maxUsage, cur.maxUsage),
                    mayTerm: prev.mayTerm || cur.mayTerm,
                }))

            return { children, maxUsage, mayTerm }
        },
    }
}

export type InternalRecursiveNodeBuilder = (
    board: BoardState,
    dicePips: DicePip[]
) => NodeAndDiceUsage

export function recursiveNodeBuilder(
    nodeBuilders: InternalBoardStateNodeBuilders
): InternalRecursiveNodeBuilder {
    const recursiveNodeBuilder = buildRecursiveNodeBuilder(nodeBuilders)

    // BoardStateNodeに合わせてラップするだけ
    return (board: BoardState, dicePips: DicePip[]) =>
        recursiveNodeBuilder({
            hasValue: true,
            usedDices: [],
            unusedDices: dicePips.map((pip) => ({ pip, used: false })),
            board,
            lastMoves: [],
        })
}

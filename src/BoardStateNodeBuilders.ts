import { BoardState, boardState } from './BoardState'
import { BoardStateNode, NO_MOVE, wrap, Wrapped } from './BoardStateNode'
import { Dice, DicePip, DiceRoll } from './Dices'
import { eog } from './EOGStatus'
import { buildDoubletNodeBuilder } from './internals/buildNodesForDoublet'
import { buildHeteroDiceNodeBuilder } from './internals/buildNodesForHeteroDice'
import { buildInternalBoardStateNodeBuilders } from './internals/internalBoardStateNodeBuilders'
import { RuleSet } from './rules/RuleSet'
import { standardRuleSet } from './rules/standardRuleSet'

export type RootBoardStateNode = {
    root: BoardStateNode
    swapped?: BoardStateNode
    dices: Dice[]
    hasValue: true
}

export function wrapRootNode(
    root: RootBoardStateNode,
    swapFirst: boolean
): Wrapped<BoardStateNode> {
    return _wrapRootNode(root, { hasValue: false }, swapFirst)
}
export function _wrapRootNode(
    root: RootBoardStateNode | { hasValue: false },
    was: RootBoardStateNode | { hasValue: false },
    swapFirst: boolean
): Wrapped<BoardStateNode> {
    function applySwapFirst(root: RootBoardStateNode, swapFirst: boolean) {
        return swapFirst && root.swapped
            ? { primary: root.swapped, secondary: root.root }
            : { primary: root.root, secondary: root.swapped }
    }
    const wrapped: Wrapped<BoardStateNode> = {
        apply: (
            f: (a: BoardStateNode) => BoardStateNode | { hasValue: false }
        ): Wrapped<BoardStateNode> => {
            if (root.hasValue) {
                const { primary, secondary } = applySwapFirst(root, swapFirst)
                const result = f(primary)
                if (result.hasValue) {
                    return wrap(result)
                }
                if (secondary) {
                    const result = f(secondary)
                    return wrap(result)
                }
            }
            return _wrapRootNode({ hasValue: false }, root, swapFirst) // or()に渡される // TODO: or()内のswapFirstの先取りをしてもいいかも
        },
        or: (
            f: (a: BoardStateNode) => BoardStateNode | { hasValue: false }
        ): Wrapped<BoardStateNode> => {
            if (!root.hasValue && was.hasValue) {
                const { primary, secondary } = applySwapFirst(was, swapFirst)
                const result = f(primary)
                if (result.hasValue) {
                    return wrap(result)
                }
                if (secondary) {
                    const result = f(secondary)
                    return wrap(result)
                }
            }
            // rootがapply()で成功している(のでor()は何もしない)か、
            // 適用した関数が失敗しているので、与引数をそのまま次に渡す
            return _wrapRootNode({ hasValue: false }, was, swapFirst)
        },
        unwrap: root.hasValue ? root.root : { hasValue: false },
    }
    return wrapped
}

/**
 * BoardStateNodeツリー生成関数の型定義
 */
export type BoardStateNodeBuilder = (
    board: BoardState,
    dice: DiceRoll
) => RootBoardStateNode

/**
 * 与えられた盤面とダイス目のペアから、BoardStateNodeを生成する
 *
 * @param board 盤面
 * @param dicePips ダイス目のペア
 * @returns 局面
 */
export function boardStateNode(
    board: BoardState,
    dicePips: DiceRoll,
    ruleSet: RuleSet = standardRuleSet
): RootBoardStateNode {
    return buildBoardStateNodeBuilder(ruleSet)(board, dicePips)
}

/**
 * 普通の目とゾロ目の場合それぞれに対応したツリー構築関数を結合して、
 * BoardStateNodeのツリー構築関数を構築する
 *
 * @param ruleSet ルールの定義
 * @returns BoardStateNodeツリー構築関数
 */
export function buildBoardStateNodeBuilder(
    ruleSet: RuleSet
): BoardStateNodeBuilder {
    // ルール定義を内部的なツリー構築関数に変換
    const internalNodeBuilders = buildInternalBoardStateNodeBuilders(ruleSet)

    // 内部的なツリー構築関数を用いて、普通の目・ゾロ目固有の処理に対応したツリー構築関数を生成
    const buildNodeWithHetero = buildHeteroDiceNodeBuilder(internalNodeBuilders)
    const buildNodeWithDoublet = buildDoubletNodeBuilder(internalNodeBuilders)

    // 両者を結合して返す
    return (board: BoardState, dicePips: DiceRoll) => {
        const { dice1, dice2 } = dicePips

        return dice1 !== dice2
            ? buildNodeWithHetero(board, dice1, dice2)
            : buildNodeWithDoublet(board, dice1, ruleSet.countForDoublet)
    }
}

/**
 * 駒の配置を格納した配列からBoardStateNodeを生成する。
 *
 * pieces[0]が自分のバーポイント、pieces[25]が相手のバーポイントとなり
 * pieces[1]-[24]は盤面の各ポイントに対応する。
 *
 * @param pieces 駒の配置。正は自駒、負は相手の駒
 * @param dice1 ダイス目
 * @param dice2 ダイス目
 * @param bornOffs すでにベアリングオフした駒の数の対（順に自分、相手：省略時は0）
 * @returns 局面
 */
export function boardStateNodeFromArray(
    pieces: number[],
    dice1: DicePip,
    dice2: DicePip,
    ruleSet: RuleSet,
    bornOffs: [number, number] = [0, 0]
): RootBoardStateNode {
    const board = boardState(pieces, bornOffs)
    return boardStateNode(board, { dice1, dice2 }, ruleSet)
}

// ダイスを無視して何も次の手がない状態のBoardStateNodeを生成する
function emptyNode(board: BoardState, dices: Dice[]): BoardStateNode {
    return {
        hasValue: true,
        dices,
        board,
        majorFirst: () => NO_MOVE,
        minorFirst: () => NO_MOVE,
        lastMoves: [],
        isRedundant: false,
        isCommitable: true,
        eogStatus: eog(),
    }
}

/**
 * 与えられた局面に対し、ダイスなし、可能な手なしのBoardStateNodeを生成する
 * @param board
 */
export function nodeWithEmptyDice(board: BoardState): BoardStateNode {
    return emptyNode(board, [])
}

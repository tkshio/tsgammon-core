import { BoardState } from '../BoardState'
import { BoardStateNode, NoMove, NO_MOVE } from '../BoardStateNode'
import { RootBoardStateNode } from '../BoardStateNodeBuilders'
import { DicePip } from '../Dices'
import {
    InternalBoardStateNodeBuilders,
    InternalRecursiveNodeBuilder,
    NodeAndDiceUsage,
    recursiveNodeBuilder,
    TmpNode,
} from './internalBoardStateNodeBuilders'

export function buildHeteroDiceNodeBuilder(
    internalNodeBuilders: InternalBoardStateNodeBuilders
): (board: BoardState, dice1: DicePip, dice2: DicePip) => RootBoardStateNode {
    // 共通ルールの設定
    const commonBuilder =
        // 最大限のダイスを使う
        addDiceUsagePruner(
            // EoGになる場合は、最大限のダイスを使わなくても合法手
            addEoGHandling(internalNodeBuilders)
        )

    // 大の目を先に使った場合のノードツリー
    const majorNodeBuilder = recursiveNodeBuilder(
        // 大の目先行の場合、駒の移動が前後するだけの冗長な手だけを除去
        addDeduplicator(commonBuilder, isRedundantMajor)
    )
    // 小の目のノードツリー構築は、大の目先行の場合の結果を参照する必要がある
    const minorNodeBuilder = (
        majorNodes: (pos: number) => BoardStateNode | NoMove
    ) =>
        recursiveNodeBuilder(
            // 大の目先行の場合と同じ結果になる手を除去
            addDeduplicator(commonBuilder, isRedundantMinor(majorNodes))
        )

    return (board: BoardState, dice1: DicePip, dice2: DicePip) =>
        buildNodesForHeteroDice(
            board,
            dice1,
            dice2,
            majorNodeBuilder,
            minorNodeBuilder
        )
}

function buildNodesForHeteroDice(
    board: BoardState,
    dice1: DicePip,
    dice2: DicePip,
    majorNodeBuilder: InternalRecursiveNodeBuilder,
    minorNodeBuilder: (
        majorNodes: (pos: number) => BoardStateNode | NoMove
    ) => InternalRecursiveNodeBuilder
): RootBoardStateNode {
    // ゾロ目は対応しない
    if (dice1 === dice2) {
        throw Error('Unexpected doublet: ' + dice1 + ',' + dice2)
    }

    // ダイスの大小を識別する
    const [pips, isMajorFirst] =
        dice1 > dice2 ? [[dice1, dice2], true] : [[dice2, dice1], false]
    const [majorPip, minorPip] = pips

    // 大の目を先に使った場合のノードツリー
    const major = majorNodeBuilder(board, pips)

    // 小の目を先に使った場合のノードツリー
    const minor = minorNodeBuilder(major.node.majorFirst)(board, [
        minorPip,
        majorPip,
    ])

    // 大の目先行、小の目先行それぞれの場合を統合して、最終的な結果を得る
    if (hasNoMove(minor)) {
        return hasNoMove(major)
            ? // どちらのダイスでも全く動かせない場合は、オリジナルのダイス順で返す
              {
                  root: major.node,
                  dices: [
                      { pip: dice1, used: true },
                      { pip: dice2, used: true },
                  ],
                  hasValue: true,
              }
            : // 小の目だけが使えないので、大の目のみ使用
              {
                  root: major.node,
                  dices: major.node.dices,
                  hasValue: true,
              }
    }

    // 大の目が使えなければ、小の目のみ
    if (hasNoMove(major)) {
        return {
            root: minor.node,
            dices: minor.node.dices,
            hasValue: true,
        }
    }

    // ダイスを1つしか使えないほうは採用しない
    if (!canUseBothRolls(minor)) {
        return { root: major.node, dices: major.node.dices, hasValue: true }
    }
    if (!canUseBothRolls(major)) {
        return {
            root: minor.node,
            dices: minor.node.dices,
            hasValue: true,
        }
    }

    // どちらのダイスも使えるので、本来のダイス順に戻して返す
    const majorDices = major.node.dices
    const minorDices = minor.node.dices
    const [majorDie, minorDie] = [
        {
            pip: majorDices[0].pip,
            used: majorDices[0].used && minorDices[1].used,
        },
        {
            pip: majorDices[1].pip,
            used: majorDices[1].used && minorDices[0].used,
        },
    ]
    const dices = isMajorFirst ? [majorDie, minorDie] : [minorDie, majorDie]
    return {
        dices,
        root: major.node,
        swapped: minor.node,
        hasValue: true,
    }

    function canUseBothRolls(arg: { node: BoardStateNode; canUse: number }) {
        return arg.canUse === 2
    }
    function hasNoMove(arg: { node: BoardStateNode; canUse: number }) {
        return arg.canUse === 0
    }
}

/**
 * EoGの状況に限り、最大限ダイスを使わなければいけない制限を緩和する
 * @param nodeBuilders 対象となるnodeBuilder
 * @returns
 */
function addEoGHandling(
    nodeBuilders: InternalBoardStateNodeBuilders
): InternalBoardStateNodeBuilders {
    // 中間ノードの子局面のいずれかがEoGになるなら(※)その中間ノードでは、ダイスは2個とも使える扱いにする
    // これにより、一方は2個使わないとEoGにできない場合でも、もう一方の1個しか使わない手を有効にする
    // ※ この場合、自駒は一つしかないので、いずれかと言っても、実際にはEoGにする手しかない
    // この処理は、ゾロ目では目の大小を意識しないので必要ない
    return {
        ...nodeBuilders,
        buildBranchNode: (node, childNodes) => {
            return childNodes.mayTerm
                ? {
                      ...nodeBuilders.buildBranchNode(node, childNodes),
                      canUse: node.unusedDices.length,
                  }
                : nodeBuilders.buildBranchNode(node, childNodes)
        },
    }
}
/**
 * isRedundant()の返り値が真なら、冗長としてマークする
 * @param nodeBuilders 対象となるnodeBUilders
 * @param isRedundant 引数のノードが重複している時に真を返す関数
 * @returns
 */
function addDeduplicator(
    nodeBuilders: InternalBoardStateNodeBuilders,
    isRedundant: (nodeAndDice: NodeAndDiceUsage) => boolean
) {
    return {
        ...nodeBuilders,
        ifLeafThenBuild: (
            tmpNode: TmpNode
        ):
            | { hasValue: true; value: NodeAndDiceUsage }
            | { hasValue: false } => {
            const maybeNode = nodeBuilders.ifLeafThenBuild(tmpNode)
            return maybeNode.hasValue
                ? isRedundant(maybeNode.value)
                    ? { hasValue: true, value: setIsRedundant(maybeNode.value) }
                    : maybeNode
                : maybeNode
        },
    }
}

/**
 * 大の目を先に使う場合の重複判定：
 * 見かけ上同じ駒を２回動かすムーブ、すなわち p/q/r に対してq/r p/qと動かす場合は冗長
 *
 * @param nodeAndDice 対象ノード
 * @returns
 */
function isRedundantMajor(nodeAndDice: NodeAndDiceUsage) {
    const moves = nodeAndDice.node.lastMoves
    return moves.length < 2 ? false : moves[1].to === moves[0].from
}

/** 小の目を先に使う場合の重複判定：
 * ダイスの使用順序を入れ替えた手が、既に大の目を先に使った場合に含まれるなら真を返す
 *
 * @param majorNodes 大の目を先に使った場合の可能手
 * @returns
 */
function isRedundantMinor(
    majorNodes: (pos: number) => BoardStateNode | NoMove
): (nodeAndDice: NodeAndDiceUsage) => boolean {
    return (nodeAndDice: NodeAndDiceUsage) => {
        const lastMoves = nodeAndDice.node.lastMoves
        if (lastMoves.length < 2) {
            return false
        }

        const [move1, move2] = lastMoves

        // 着手を入れ替えた手、q/q+m p/p+nがすでにあれば冗長
        const node = majorNodes(move2.from)
        if (node.hasValue && node.majorFirst(move1.from).hasValue) {
            return true
        }

        // 同じ駒を2回動かすムーブで、かつダイスを入れ替えた場合のムーブと比べる
        // すなわち、小さい目を先行して使う手p/p+m/rが、p/p+n/rと実質的に同じかどうかを検出する
        if (move1.to === move2.from) {
            const swappedMovesNode = majorNodes(move1.from)
            // 2' ダイスを入れ替えて動かせない(p/p+nが禁手)なら、冗長ではない
            if (swappedMovesNode.hasValue) {
                // ダイスを入れ替えても、二つ目のダイス（小さい目）では動かせない
                // (p+n/rが禁手)なら、冗長ではない(ベアリングオフの場合に発生する)
                {
                    const majorPip = move2.pip
                    const swappedMoveTo = move1.from + majorPip
                    if (!swappedMovesNode.majorFirst(swappedMoveTo).hasValue) {
                        return false
                    }
                }
                // どちらもヒットでない場合は、冗長
                const isHit = move1.isHit
                const swappedMove = swappedMovesNode.lastMoves[0]
                return !isHit && !swappedMove.isHit
            } else {
                return false
            }
        }
        return false
    }
}

/**
 * 最大限ダイスを使えるかEoGになる子ノードに絞り込む。
 * ゾロ目では使えるダイスの数がばらつかないので、この絞り込みは不要
 *
 * @param nodeBuilders 対象となるnodeBuilders
 * @returns
 */
function addDiceUsagePruner(
    nodeBuilders: InternalBoardStateNodeBuilders
): InternalBoardStateNodeBuilders {
    return {
        ...nodeBuilders,
        buildBranchNode: (parentNode, childNodes): NodeAndDiceUsage =>
            nodeBuilders.buildBranchNode(parentNode, {
                ...childNodes,
                children: childNodes.children.map((child) => {
                    const { node, canUse } = child
                    return canUse === childNodes.maxUsage ||
                        (node.hasValue && node.eogStatus.isEndOfGame)
                        ? child
                        : { node: NO_MOVE, canUse: -1 }
                }),
            }),
    }
}

function setIsRedundant(nodeAndUsage: NodeAndDiceUsage): NodeAndDiceUsage {
    return {
        node: {
            ...nodeAndUsage.node,
            isRedundant: true,
        },
        canUse: nodeAndUsage.canUse,
    }
}

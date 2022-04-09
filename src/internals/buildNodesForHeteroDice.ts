import { BoardState } from '../BoardState'
import { BoardStateNode, NoMove, NO_MOVE } from '../BoardStateNode'
import { Dice, DicePip } from '../Dices'
import { Move } from '../Move'
import { applyDicePipToPoints } from './applyDicePipToPoints'
import { buildNodeForEoG, leaveNodeBuilder, NodeBuilder } from './NodeBuilder'

/**
 * ゾロ目でないダイスのペアに対して、バックギャモンのルールに基づいて可能な手を列挙し、BoardStateNodeとして返す
 *
 * @param board 盤面
 * @param dice1 ダイスの目
 * @param dice2 ダイスの目
 * @returns
 */
export function buildNodesForHeteroDice(
    board: BoardState,
    dice1: DicePip,
    dice2: DicePip
): BoardStateNode {
    if (dice1 === dice2) {
        throw Error('Unexpected doublet: ' + dice1 + ',' + dice2)
    }
    const majorPip = dice1 > dice2 ? dice1 : dice2
    const minorPip = dice1 < dice2 ? dice1 : dice2

    // 大きい目を先に使った場合の候補手
    const [majorTmp, majorMarked] = applyMajorPipFirst(
        board,
        majorPip,
        minorPip
    )

    // 小さい目を先に使う場合、上記の結果を踏まえた冗長判定がある
    const [minorTmp, minorMarked] = applyMinorPipFirst(
        board,
        majorPip,
        minorPip,
        majorTmp
    )

    // marked=使えないダイスの個数を見て、適用可能な手を絞り込む
    let major: (pos: number) => BoardStateNode | NoMove
    let minor: (pos: number) => BoardStateNode | NoMove
    let usableDice: Dice[]

    if (majorMarked === 0) {
        // 大ぞろめにきい目を先に使えば、全てのダイスが使える
        major = majorTmp
        minor =
            minorMarked === 0 // すべてのダイスを使えるなら、小さい目を先に使っても良い
                ? minorTmp
                : () => NO_MOVE
        usableDice = [
            { pip: dice1, used: false },
            { pip: dice2, used: false },
        ]
    } else if (minorMarked === 0) {
        // 小さい目を先に使えば、すべてのダイスが使える
        minor = minorTmp
        major = () => NO_MOVE // majorMarked !== 0はすでに確定している
        usableDice = [
            { pip: dice1, used: false },
            { pip: dice2, used: false },
        ]
    } else {
        // 2個使うことはできない場合
        // １個しか使えない場合は、大きい目から使う
        if (majorMarked === 1) {
            major = majorTmp
            minor = () => NO_MOVE
            usableDice = [
                { pip: majorPip, used: false },
                { pip: minorPip, used: true },
            ]
        } else if (minorMarked === 1) {
            major = () => NO_MOVE
            minor = minorTmp
            usableDice = [
                { pip: minorPip, used: false },
                { pip: majorPip, used: true },
            ]
        } else {
            // どの目も使えない
            major = () => NO_MOVE
            minor = () => NO_MOVE
            usableDice = [
                { pip: dice1, used: true },
                { pip: dice2, used: true },
            ]
        }
    }

    return {
        hasValue: true,
        dices: usableDice,
        board: board,
        majorFirst: major,
        minorFirst: minor,
        lastMoves: () => [],
        isRedundant: false,

        // 使えるダイスは左側にある前提
        isCommitable: usableDice.length > 0 && usableDice[0].used,
    }
}

// 大きい目を先に使う場合の手のリストアップ
function applyMajorPipFirst(
    board: BoardState,
    majorDice: DicePip,
    minorDice: DicePip
) {
    const isRedundantForMajorPipFirstCase = (move1: Move, move2: Move) => {
        // 見かけ上同じ駒を２回動かすムーブ
        // すなわち、p/q/r に対してq/r p/qと動かす場合は冗長
        if (move2.to === move1.from) {
            return true
        }
        return false
    }
    return applyDices(
        board,
        majorDice,
        minorDice,
        isRedundantForMajorPipFirstCase
    )
}

// 小さい目を先に使う場合の手のリストアップ
function applyMinorPipFirst(
    board: BoardState,
    majorDice: DicePip,
    minorDice: DicePip,
    majorTmp: (pos: number) => BoardStateNode | NoMove
) {
    // moves = p/p+n q/q+m に対し、すでにmajorTmpに着手を入れ替えた手q/q+m p/p+nがあるはずなので、原則としては冗長
    const isRedundantFunc = (move1: Move, move2: Move) => {
        // 着手を入れ替えた手、q/q+m p/p+nがすでにあれば冗長
        const node = majorTmp(move2.from)
        if (node.hasValue && node.majorFirst(move1.from).hasValue) {
            return true
        }

        // 同じ駒を2回動かすムーブで、かつダイスを入れ替えた場合のムーブと比べる
        // すなわち、小さい目を先行して使う手p/p+m/rが、p/p+n/rと実質的に同じかどうかを検出する
        if (move1.to === move2.from) {
            const swappedMovesNode = majorTmp(move1.from)
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
                const swappedMove = swappedMovesNode.lastMoves()[0]
                return !isHit && !swappedMove.isHit
            } else {
                return false
            }
        }
        return false
    }
    return applyDices(board, minorDice, majorDice, isRedundantFunc)
}

function applyDices(
    board: BoardState,
    firstDice: DicePip,
    secondDice: DicePip,
    isRedundantFunc: (move1: Move, move2: Move) => boolean = () => false
): [(pos: number) => BoardStateNode | NoMove, number] {
    const dicesAfterUse = {
        pip: firstDice,
        used: true,
    }

    // ビルダーの事前準備：最初の目を適用した後は、二つ目のダイスに対応するノードを生成する
    const nodeBuilder: NodeBuilder = leaveNodeAndParentBuilder(
        secondDice,
        dicesAfterUse,
        isRedundantFunc
    )

    // 各ポイントに最初の目を適用して子ノードを生成する
    // （内部で各ポイントについて上記のnodeBuilderが呼ばれ、孫ノードが生成される）
    return applyDicePipToPoints(board, firstDice, nodeBuilder, 2)
}

// ダイスを1個使った状態を表すノードと、その子ノードとなる末端ノードを構築する
function leaveNodeAndParentBuilder(
    pip: DicePip,
    usedDice: Dice,
    isRedundantFunc: (move1: Move, move2: Move) => boolean = () => false
): NodeBuilder {
    return (board: BoardState, firstMove: Move) => {
        const lastMovesForLeave = [firstMove]
        const isEog = board.eogStatus().isEndOfGame
        if (isEog) {
            // 盤面が終了状態になっている場合は、Leafノードは生成せず、EoGを表すノードを返す
            //
            // この時点ではダイスを一個しか使っていないが、ダイスを入れ替えると二個使える場合、
            // 一個しか使えない手は無効化されてしまうので、二個目のダイスも使用済とマークし、
            // marked=0として返すことにより、ダイスを二個使った手として処理させている
            // （よって、ロール直後は、表示上ダイスは二つとも使える状態で表示される）
            return buildNodeForEoG(
                board,
                [usedDice, { pip, used: true }],
                lastMovesForLeave,
                0
            )
        }

        // 二つ目のpipを使って末端のノードを構築する
        const nodeBuilder = leaveNodeBuilder(
            [usedDice],
            pip,
            (secondMove) => [firstMove, secondMove],
            (secondMove) => isRedundantFunc(firstMove, secondMove)
        )

        const [major, unusedDices] = applyDicePipToPoints(
            board,
            pip,
            nodeBuilder,
            1
        )
        // applyDicePipToPointsは未使用のダイスの最小値を返すので、
        // unusedDiceはどこかのポイントがムーブ可能であれば0、
        // そうでなければ1（ムーブできないのでダイスが1個余る）となる。

        // 末端ノードの親ノードを生成して返す
        return [
            {
                hasValue: true,
                dices: [usedDice, { pip, used: unusedDices === 1 }],
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

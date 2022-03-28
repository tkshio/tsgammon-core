import { BoardState } from "../BoardState";
import { BoardStateNode, NoMove, NO_MOVE } from "../BoardStateNode";
import { Dice, DicePip } from "../Dices";
import { Move } from "../Move";

// 局面ツリー構築用の型


export type NodeBuilder = (board: BoardState, move: Move) => BuiltNode;

// 局面ツリーを構成するノード：numberには、その局面について、子局面を辿っていった結果
// 使用できなかったダイスの数が格納される
export type BuiltNode = [(BoardStateNode | NoMove), number]



// 終局を表すノードを構築する
export function buildNodeForEoG(
    board: BoardState,
    usedDices: Dice[],
    lastMoves: Move[],
    mark: number)
    : BuiltNode {
    return [{
        hasValue: true,
        dices: usedDices, board,
        majorFirst: () => NO_MOVE,
        minorFirst: () => NO_MOVE,
        lastMoves: () => lastMoves,
        isRedundant: false,
        isCommitable: true
    }, mark]
}

/** 
 * 末端、すなわちダイスを全て使った状態のノードを構築する関数を返す。
 * 
 * 各引数は、末端ノードの親についての情報を渡す。
 * @param usedDice すでに使用済みのダイス
 * @param pip 親ノードの局面から末端ノードの局面への遷移で使用する目
 * @param addLastMoves 親ノードの局面に至るまでにすでに適用済みの手と、最後の手をあわせて配列を返す関数
 * @param isRedundantFunc 最終局面が冗長かどうかを判定する関数
 * 
 * @returns {@link applyDicePipToPoints()}が使用する、最後の局面と、そこに至る最後の手を受け取り、末端ノードを返す関数。
 */
export function leaveNodeBuilder(
    usedDice: Dice[],
    pip: DicePip,
    addLastMoves: (move: Move) => Move[],
    isRedundantFunc: (move: Move) => boolean = () => false)
    : NodeBuilder {
    const dicesUsedUp = usedDice.concat({ pip, used: true })

    return (boardAfter: BoardState, move: Move): BuiltNode => {
        // 最後のダイス、lastDiceを適用した局面を表すノード
        const lastMoves = addLastMoves(move)
        const isRedundant = isRedundantFunc(move)
        return [{
            hasValue: true,
            dices: dicesUsedUp,
            board: boardAfter,
            majorFirst: () => NO_MOVE,
            minorFirst: () => NO_MOVE,
            lastMoves: () => lastMoves,
            isRedundant: isRedundant,
            isCommitable: true
        }, 0/*最後のダイスが適用できたので、未使用のダイスは0*/]
    }
}



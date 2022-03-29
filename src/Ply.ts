import { DicePip } from "./Dices";
import { AbsoluteMove } from "./AbsoluteMove";

/**
 * 手番に行ったチェッカープレイを表す
 */
export type Ply = {
    moves: AbsoluteMove[];
    dices: DicePip[];
    isRed: boolean
}

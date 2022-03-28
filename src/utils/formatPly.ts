import { formatDices } from "./formatDices";
import { formatMoves, MoveFormatDirection } from "./formatMove";
import { Ply } from "../Ply";

/**
 * 一手番でのチェッカープレイの内容を文字列に変換する
 * 
 * ex) Roll 31: Moves 17/20 19/20
 * 
 * @param ply 一手番でのチェッカープレイ内容
 * @param direction ムーブの表記方法
 * @returns 変換後の文字列
 */
export function formatPly(ply: Omit<Ply, 'isRed'>, direction: MoveFormatDirection = MoveFormatDirection.ABSOLUTE_INV): string {
    if (ply.dices.length === 0) {
        return "";
    }

    const roll = formatDices(ply.dices);
    const moves = ply.moves.length === 0 ? ""
        : `Moves ${formatMoves(ply.moves, direction).join(" ")}`;

    return `Roll ${roll} ${moves}`;
}
/**
 * 一手番でのチェッカープレイの内容を簡潔な文字列に変換する
 * 
 * ex) 31:17/20 19/20
 * 
 * @param ply 一手番でのチェッカープレイ内容
 * @param direction ムーブの表記方法
 * @param fmtDoublet ゾロ目を短縮表記（e.g. 1 1 => 1(4)）する場合はtrue
 * @param labelNoMove 
 * @returns 変換後の文字列
 */
export function formatPlyAbbr(ply: Omit<Ply, 'isRed'>,
    direction: MoveFormatDirection = MoveFormatDirection.RELATIVE_DEC,
    fmtDoublet: boolean = true,
    labelNoMove: string = "") {

    if (ply.dices.length === 0) {
        return "";
    }

    const roll = formatDices(ply.dices, fmtDoublet);
    const moves = formatMoves(ply.moves, direction, labelNoMove).join(" ");
    return `${roll}: ${moves}`;
}

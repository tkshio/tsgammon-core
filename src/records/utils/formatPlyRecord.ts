import { MoveFormatDirection } from "../../utils/formatMove";
import { formatPlyAbbr } from "../../utils/formatPly";
import { PlyRecord } from "../PlyRecord";
import { SGResult } from "../SGResult";


/**
 * 一手番でのプレイ（チェッカープレイ・キューブアクション）を文字列に変換する
 * 
 * @param plyRecord 
 * @param direction 
 * @param fmtDoublet 
 * @param labelNoMove 
 * @returns 
 */
export function formatPlyRecord(plyRecord: PlyRecord,
    direction: MoveFormatDirection = MoveFormatDirection.RELATIVE_DEC,
    fmtDoublet: boolean = true,
    labelNoMove: string = "") {
    switch (plyRecord.tag) {
        case "Commit": {
            return formatPlyAbbr(plyRecord.ply, direction, fmtDoublet, labelNoMove);
        }
        case "Double": {
            return " Doubles => " + plyRecord.cubeValue;
        }
        case "Pass": {
            return "Pass";
        }
        case "Take": {
            return " Takes";
        }
        case "EOG": {
            const stake = plyRecord.stake;
            return plyRecord.sgResult === SGResult.NOGAME ? "No game" :
                formatStake(plyRecord.sgResult === SGResult.REDWON ? stake.redScore : stake.whiteScore);
        }
    }

    function formatStake(score: number): string {
        return score === 0 ? "" : `Wins ${score} point`;
    }
}

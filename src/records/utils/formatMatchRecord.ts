import { Score } from '../../Score'
import { PlyRecord, PlyRecordInPlay } from '../PlyRecord'
import { formatPlyRecord } from './formatPlyRecord'
import { GameRecord } from '../GameRecord'
import { MatchRecord } from '../MatchRecord'
import { Ply } from '../../Ply'
import { SGResult } from '../SGResult'
import { MoveFormatDirection } from '../../utils/formatAbsMove'
import { EOGStatus } from '../../EOGStatus'
import { defaultNames } from './defaultNames'

/**
 * MatchRecordsをテキスト形式に変換する
 *
 * @param matchRecord 対象となるマッチ
 * @param conf オプショナルルールの適否など、ヘッダ情報に出力する設定情報
 */
export function formatMatchRecord<T>(
    matchRecord: MatchRecord<T>,
    redPlayer = defaultNames.red,
    whitePlayer = defaultNames.white
): string {
    const header = formatHeaderPart(matchRecord, redPlayer, whitePlayer)

    const gameLog = matchRecord.gameRecords
        .map((gameRecord, index) =>
            formatGameRecord(gameRecord, index, redPlayer, whitePlayer).join(
                '\n'
            )
        )
        .join('\n\n\n\n')

    const curGameText =
        (matchRecord.gameRecords.length === 0 ? '' : '\n\n\n\n') +
        formatGameRecord(
            matchRecord.curGameRecord,
            matchRecord.gameRecords.length,
            redPlayer,
            whitePlayer
        ).join('\n')

    return header + gameLog + curGameText
}

// ヘッダ情報の出力：confのルール設定や日時など
function formatHeaderPart<T>(
    matchRecord: MatchRecord<T>,
    redPlayer = defaultNames.red,
    whitePlayer = defaultNames.white
) {
    const conf = matchRecord.conf
    const date = new Date()
    const digit2 = (s: string) => s.padStart(2, '0')

    const eventDate = `${date.getFullYear()}.${digit2(
        '' + (date.getMonth() + 1)
    )}.${digit2('' + date.getDate())}`
    const eventTime = `${digit2('' + date.getHours())}.${digit2(
        '' + date.getMinutes()
    )}`
    const header = `; [Site "tsgammon-ui"]
; [Player 1 ${whitePlayer}]
; [Player 2 ${redPlayer}]
; [EventDate "${eventDate}"]
; [EventTime "${eventTime}"]
; [Variation "${conf.name}"]
; [Unrated "On"]
; [Jacoby "${conf.jacobyRule ? 'On' : 'Off'}"]
; [Beaver "Off"]
; [CubeLimit "${conf.cubeMax}"]

${matchRecord.matchState.matchLength + ' point match'}

`
    return header
}

// 1ゲーム分の出力
function formatGameRecord<T>(
    gameRecord: GameRecord<T>,
    gameNum: number,
    redPlayer = defaultNames.red,
    whitePlayer = defaultNames.white
): string[] {
    const columnWidth = 34
    const numWidth = 3
    const { scoreBefore, plyRecords } = gameRecord

    const gameDesc = ` Game ${gameNum + 1}`
    const scoreDesc = formatScoreDesc(scoreBefore)

    const turns = buildTurns(plyRecords.map((rec) => rec.plyRecord)).map(
        (turn, index) => formatTurn(turn, index)
    )

    const stakes = gameRecord.isEoG
        ? formatStakeLine(gameRecord.eogRecord.stake)
        : ''

    return [gameDesc, scoreDesc].concat(turns, stakes)

    function formatScoreDesc(scoreBefore: Score) {
        const whiteCol = (`${whitePlayer} : ` + scoreBefore.whiteScore).padEnd(
            numWidth + 1 + columnWidth
        )
        const redCol = `${redPlayer} : ${scoreBefore.redScore}`
        return ` ${whiteCol}${redCol}`
    }

    function formatTurn(turn: Turn, index: number) {
        const num = ('' + (index + 1)).padStart(numWidth)
        const whiteCol = (
            turn.white
                ? formatPlyRecord(
                      turn.white,
                      MoveFormatDirection.RELATIVE_DEC,
                      false,
                      'Cannot Move'
                  )
                : ''
        ).padEnd(columnWidth)
        const redCol = turn.red
            ? formatPlyRecord(
                  turn.red,
                  MoveFormatDirection.RELATIVE_DEC,
                  false,
                  'Cannot Move'
              )
            : ''
        return `${num}) ${whiteCol}${redCol}`
    }

    function formatStakeLine(stake: Score): string {
        const whiteStake = formatStake(stake.whiteScore)
        const redStake = formatStake(stake.redScore)
        return `     ${(' ' + whiteStake).padEnd(columnWidth)} ${redStake}`

        function formatStake(score: number): string {
            return score === 0 ? '' : `Wins ${score} point`
        }
    }
}

// 作業用の、White側のPlyRecordだけを表す型
type WhiteRecord =
    | {
          tag: 'Commit'
          ply: Omit<Ply, 'isRed'>
          isRed: false
      }
    | {
          tag: 'Double'
          cubeValue: number
          isRed: false
      }
    | {
          tag: 'Take' | 'Pass'
          isRed: false
      }
    | {
          tag: 'EOG'
          stake: Score
          sgResult: SGResult
          eogStatus: EOGStatus
          isRed: boolean
      }

// White=>Redの対にしたPlyRecord
type Turn = {
    white?: WhiteRecord
    red?: PlyRecord
}

// 対にする作業中のTurnの配列
type TmpTurns = {
    // すでにWhite=>Redの対になった配列
    turns: Turn[]

    // まだ対となるRedが来ていないWhite側のPlyRecord
    lastWhite?: WhiteRecord
}

// White=>RedとなるようPlyRecordを2個ずつペアにして、Turnを構成する
function buildTurns(recs: PlyRecordInPlay[]): Turn[] {
    const { turns, lastWhite }: TmpTurns = recs.reduce(
        (prev: TmpTurns, plyRecord: PlyRecordInPlay): TmpTurns => {
            const cur = plyRecord
            if (prev.lastWhite === undefined) {
                // 保留中のWhiteがない
                if (cur.isRed) {
                    // 先にRedがきたので、whiteなしの記録として格納する
                    return { turns: prev.turns.concat({ red: cur }) }
                } else {
                    // Whiteが来たので、一旦保留
                    const lastWhite = cur as WhiteRecord
                    return { turns: prev.turns, lastWhite }
                }
            } else {
                // 保留中のWhiteがある
                if (cur.isRed) {
                    // Whiteを保留しているところにRedが来たので、ペアにして格納
                    return {
                        turns: prev.turns.concat({
                            white: prev.lastWhite,
                            red: cur,
                        }),
                    }
                } else {
                    // さらにWhiteが来てしまったので、保留していた分をredなしの記録として格納、
                    // 後から来た分は保留する
                    const lastWhite = cur as WhiteRecord
                    return {
                        turns: prev.turns.concat({ white: prev.lastWhite }),
                        lastWhite,
                    }
                }
            }
        },
        { turns: [], lastWhite: undefined } as TmpTurns
    )

    if (lastWhite) {
        return turns.concat({ white: lastWhite })
    } else {
        return turns
    }
}

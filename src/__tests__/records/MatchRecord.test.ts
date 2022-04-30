import { eog } from '../../EOGStatus'
import { standardConf } from '../../GameConf'
import {
    addPlyRecord,
    matchRecord,
    recordFinishedGame,
    setEoGRecord,
} from '../../records/MatchRecord'
import {
    plyRecordForCheckerPlay,
    plyRecordForEoG,
} from '../../records/PlyRecord'
import { SGResult } from '../../records/SGResult'
import { score, scoreAsRed, scoreAsWhite } from '../../Score'

describe('MatchRecord', () => {
    test('holds match records length', () => {
        const mRecord = matchRecord(standardConf, 5)
        expect(mRecord.matchLength).toBe(5)
    })
    test('holds record for unlimited match when matchLength omitted', () => {
        const mRecord = matchRecord()
        expect(mRecord.matchLength).toBe(0)
    })
    const mRecord = matchRecord()
    const ply = { moves: [], dices: [], isRed: true }
    const plyRecord = plyRecordForCheckerPlay(ply)
    const mRecordAfterPlay = addPlyRecord(mRecord, plyRecord, {
        foo: 'bar',
    })
    test('accepts PlyRecord for play and an object', () => {
        expect(mRecordAfterPlay.curGameRecord.plyRecords.length).toBe(1)
        expect(
            mRecordAfterPlay.curGameRecord.plyRecords[0].state
        ).toStrictEqual({
            foo: 'bar',
        })
    })
    const eogRecord = plyRecordForEoG(score(), SGResult.REDWON, eog())
    const mRecordAfterEoG = setEoGRecord(mRecordAfterPlay, eogRecord)
    test('sets EoGRecord at end of game', () => {
        expect(mRecordAfterEoG.gameRecords.length).toBe(0)
    })
    test('records finished current game and start next game with recordFinishedGame()', () => {
        const mRecordNewGame = recordFinishedGame(mRecordAfterEoG)
        expect(mRecordNewGame.gameRecords.length).toBe(1)
    })
    test('discards current game in play and start next game with recordFinishedGame()', () => {
        const mRecordNewGame = recordFinishedGame(mRecordAfterPlay)
        expect(mRecordNewGame.gameRecords.length).toBe(0)
    })
})

describe('matchRecord(crawford rule)', () => {
    const mRecord = matchRecord(
        standardConf,
        3,
        score({ whiteScore: 1, redScore: 0 })
    )
    test('sets next game as crawford', () => {
        const mRecordEoG = setEoGRecord(
            mRecord,
            plyRecordForEoG(scoreAsRed(1), SGResult.REDWON, eog())
        )
        const cur = mRecordEoG.curGameRecord

        // まだCrawfordでない(1:0 => 1:1)
        expect(cur.isEoG ? cur.isCrawfordNext : true).toBeFalsy()

        const mRecord2 = recordFinishedGame(mRecordEoG)
        const mRecord2EoG = setEoGRecord(
            mRecord2,
            plyRecordForEoG(scoreAsWhite(1), SGResult.WHITEWON, eog())
        )
        // Crawfordになった(1:1=>2:1)
        expect(
            mRecord2EoG.curGameRecord.isEoG
                ? mRecord2EoG.curGameRecord.isCrawfordNext
                : false
        ).toBeTruthy()
        const mRecord3 = recordFinishedGame(mRecord2EoG)
        expect(mRecord3.curGameRecord.isCrawford).toBeTruthy()

        // 次からはCrawfordではない(2:1=>2:2)
        const mRecord3EoG = setEoGRecord(
            mRecord3,
            plyRecordForEoG(scoreAsRed(1), SGResult.REDWON, eog())
        )
        expect(
            mRecord3EoG.curGameRecord.isEoG
                ? mRecord3EoG.curGameRecord.isCrawfordNext
                : true
        ).toBeFalsy()

        const mRecord4 = recordFinishedGame(mRecord3EoG)
        expect(mRecord4.curGameRecord.isCrawford).toBeFalsy()
        const mRecord4EoG = setEoGRecord(
            mRecord4,
            plyRecordForEoG(scoreAsWhite(1), SGResult.WHITEWON, eog())
        )
        const mRecordEoM = recordFinishedGame(mRecord4EoG)
        expect(mRecordEoM.isEndOfMatch).toBeTruthy()
    })
})

import {
    matchStateEoG,
    matchStateForPointMatch,
    matchStateForUnlimitedMatch,
    matchStateInPlay,
} from '../../dispatchers/MatchState'
import { eog } from '../../EOGStatus'
import { standardConf } from '../../GameConf'
import {
    addPlyRecord,
    discardCurrentGame,
    matchRecord,
    MatchRecordInPlay,
    recordFinishedGame,
    eogRecord,
} from '../../records/MatchRecord'
import {
    plyRecordForCheckerPlay,
    plyRecordForEoG,
} from '../../records/PlyRecord'
import { SGResult } from '../../records/SGResult'
import { score, scoreAsRed, scoreAsWhite } from '../../Score'

describe('MatchRecord', () => {
    test('holds match records length', () => {
        const mRecord = matchRecord(standardConf, matchStateForPointMatch(5))
        expect(mRecord.matchState.matchLength).toBe(5)
    })
    test('holds record for unlimited match when matchLength omitted', () => {
        const mRecord = matchRecord(undefined, matchStateForUnlimitedMatch())
        expect(mRecord.matchState.matchLength).toBe(0)
    })
    const mRecord = matchRecord(undefined, matchStateForUnlimitedMatch())
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
    const matchState = matchStateEoG(
        mRecordAfterPlay.matchState,
        score(),
        eog()
    )
    const plyRecordEoG = plyRecordForEoG(score(), SGResult.REDWON, eog())
    const mRecordAfterEoG = eogRecord(
        mRecordAfterPlay,
        matchState,
        plyRecordEoG
    )
    test('sets EoGRecord at end of game', () => {
        expect(mRecordAfterEoG.gameRecords.length).toBe(0)
    })
    test('records finished current game and start next game with recordFinishedGame()', () => {
        const mRecordNewGame = recordFinishedGame(mRecordAfterEoG)
        expect(mRecordNewGame.gameRecords.length).toBe(1)
    })
    test('discards current game in play and start next game with recordFinishedGame()', () => {
        const mRecordNewGame = discardCurrentGame(mRecordAfterPlay)
        expect(mRecordNewGame.gameRecords.length).toBe(0)
    })
})

describe('matchRecord(crawford rule)', () => {
    const mRecord = matchRecord(
        standardConf,
        matchStateInPlay(3, score({ whiteScore: 1, redScore: 0 }))
    )
    test('sets next game as crawford', () => {
        const eogMatchState = matchStateEoG(
            mRecord.matchState,
            scoreAsRed(1),
            eog()
        )
        const mRecordEoG = eogRecord(
            mRecord,
            eogMatchState,
            plyRecordForEoG(scoreAsRed(1), SGResult.REDWON, eog())
        )

        // まだCrawfordでない(1:0 => 1:1)
        expect(mRecordEoG.matchState.isCrawfordNext).toBeFalsy()

        const mRecord2 = recordFinishedGame(
            mRecordEoG
        ) as MatchRecordInPlay<undefined>
        const mRecord2EoG = eogRecord(
            mRecord2,
            matchStateEoG(mRecord2.matchState, scoreAsWhite(1), eog()),
            plyRecordForEoG(scoreAsWhite(1), SGResult.WHITEWON, eog())
        )
        // Crawfordになった(1:1=>2:1)
        expect(mRecord2EoG.matchState.isCrawfordNext).toBeTruthy()
        const mRecord3 = recordFinishedGame(
            mRecord2EoG
        ) as MatchRecordInPlay<undefined>
        expect(mRecord3.curGameRecord.isCrawford).toBeTruthy()

        // 次からはCrawfordではない(2:1=>2:2)
        const mRecord3EoG = eogRecord(
            mRecord3,
            matchStateEoG(mRecord3.matchState, scoreAsRed(1), eog()),
            plyRecordForEoG(scoreAsRed(1), SGResult.REDWON, eog())
        )
        expect(mRecord3EoG.matchState.isCrawfordNext).toBeFalsy()

        const mRecord4 = recordFinishedGame(
            mRecord3EoG
        ) as MatchRecordInPlay<undefined>
        expect(mRecord4.curGameRecord.isCrawford).toBeFalsy()
        const mRecord4EoG = eogRecord(
            mRecord4,
            matchStateEoG(mRecord4.matchState, scoreAsWhite(1), eog()),
            plyRecordForEoG(scoreAsWhite(1), SGResult.WHITEWON, eog())
        )
        const mRecordEoM = recordFinishedGame(mRecord4EoG)
        expect(mRecordEoM.matchState.isEoG).toBeTruthy()
        expect(
            mRecordEoM.matchState.isEoG && mRecordEoM.matchState.isEoM
        ).toBeTruthy()
    })
})

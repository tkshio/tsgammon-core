import { boardState } from '../../BoardState'
import { cube, CubeOwner } from '../../CubeState'
import {
    cbActionRed,
    cbActionWhite,
    cbInPlayRed,
    cbInPlayWhite,
    cbResponseRed,
    cbResponseWhite,
    cbToRollRed,
    cbToRollWhite,
} from '../../dispatchers/CubeGameState'
import { GameState } from '../../GameState'
import {
    MatchState,
    matchStateForPointMatch,
    matchStateForUnlimitedMatch,
    MatchStateInPlay,
} from '../../MatchState'
import { RSNONE, rsOfferedRed } from '../../dispatchers/ResignState'
import { ResignOffer } from '../../ResignOffer'
import {
    inPlayStateRed,
    inPlayStateWhite,
    toRollStateRed,
    toRollStateWhite,
} from '../../dispatchers/SingleGameState'
import { Bit, littleEndianReducer, toMatchID } from '../../utils/toMatchID'
import { score } from '../../Score'
import { toGameState } from '../../dispatchers/utils/toGameState'

describe('toMatchID()', () => {
    test('encodes matchState', () => {
        const matchState: MatchStateInPlay = {
            matchLength: 9,
            scoreBefore: score({ redScore: 2, whiteScore: 4 }),
            score: score({ redScore: 2, whiteScore: 4 }),
            stakeConf: { jacobyRule: false },
            isCrawford: false,
            isEoG: false,
        }
        const gameState: GameState = toGameState(
            {
                cbState: cbInPlayWhite(cube(2, CubeOwner.RED, 16)),
                sgState: inPlayStateWhite(boardState(), { dice1: 5, dice2: 2 }),
            },
            RSNONE
        )

        const matchID = toMatchID(matchState, gameState).matchID
        expect(matchID).toEqual('QYkqASAAIAAE')
    })

    const _gameState: GameState = toGameState(
        {
            cbState: cbToRollRed(cube(1), 'Skip'),
            sgState: toRollStateRed(boardState()),
        },
        RSNONE
    )
    const _matchState: MatchState = matchStateForUnlimitedMatch(score(), true)

    test('encodes opening state of unlimited game with red6/white4', () => {
        const {
            matchID,
            //, ...matchInfo
        } = toMatchID(_matchState, _gameState)
        //console.log(matchInfo)
        //console.log(decodeMatchID('MAEAAAAAAAAA'))
        expect(matchID).toEqual('MAEAAAAAAAAA')
    })
    test('encodes cube=4', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbToRollRed(cube(4), 'Skip'),
                sgState: toRollStateRed(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('MgEAAAAAAAAA')
    })
    test('encodes cube owned by red', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbToRollRed(cube(4, CubeOwner.RED), 'Skip'),
                sgState: toRollStateRed(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('AgEAAAAAAAAA')
    })
    test('encodes cube owned by white', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbToRollRed(cube(4, CubeOwner.WHITE), 'Skip'),
                sgState: toRollStateRed(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('EgEAAAAAAAAA')
    })
    test('encodes white to roll', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbToRollWhite(cube(4, CubeOwner.WHITE), 'Skip'),
                sgState: toRollStateWhite(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('UgkAAAAAAAAA')
    })
    test('encodes white to play cube action', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbActionWhite(cube(4, CubeOwner.WHITE)),
                sgState: toRollStateWhite(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('UgkAAAAAAAAA')
    })
    test('encodes white to play cube response', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbResponseWhite(cube(1)),
                sgState: toRollStateRed(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('MBkAAAAAAAAA')
    })
    test('encodes white to play checker', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbInPlayWhite(cube(4, CubeOwner.WHITE)),
                sgState: inPlayStateWhite(boardState(), { dice1: 5, dice2: 3 }),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('UokOAAAAAAAA')
    })
    test("encodes white to play checker(reverted roll won't change matchID)", () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbInPlayWhite(cube(4, CubeOwner.WHITE)),
                sgState: inPlayStateWhite(boardState(), { dice1: 3, dice2: 5 }),
            },
            RSNONE
        )

        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('UokOAAAAAAAA') // Gnu Backgammon doesn't change matchID
    })

    test('encodes red to roll', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbToRollRed(cube(1), 'Skip'),
                sgState: toRollStateRed(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('MAEAAAAAAAAA')
    })
    test('encodes red to play cube action', () => {
        const gameState: GameState = toGameState(
            {
                ..._gameState,
                cbState: cbActionRed(cube(1)),
                sgState: toRollStateRed(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('MAEAAAAAAAAA')
    })
    test('encodes red to play cube response', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbResponseRed(cube(1)),
                sgState: toRollStateWhite(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('cBEAAAAAAAAA')
    })
    test('encodes red to play checker', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbInPlayRed(cube(1)),
                sgState: inPlayStateRed(boardState(), { dice1: 5, dice2: 3 }),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('MIEOAAAAAAAA')
    })
    test('encodes crawford', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbToRollRed(cube(1), 'Skip'),
                sgState: toRollStateRed(boardState()),
            },
            RSNONE
        )
        const matchState = {
            ..._matchState,
            matchLength: 1,
            stakeConf: { jacobyRule: false },
            isCrawford: true,
        }

        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('sAEgAAAAAAAE')
    })
    test('white offers to resign a backgammon', () => {
        const gameState: GameState = toGameState(
            {
                cbState: cbToRollWhite(cube(1), 'Skip'),
                sgState: toRollStateWhite(boardState()),
            },
            rsOfferedRed(ResignOffer.Backgammon)
        )
        const matchState: MatchState = matchStateForPointMatch(5)
        const { matchID } = toMatchID(matchState, gameState)
        expect(matchID).toEqual('MGGgAAAAAAAE')
    })
})

describe('littleEndianReducer', () => {
    test('reduces bitstream to byte', () => {
        const buffer = new ArrayBuffer(9)
        const reducer = littleEndianReducer(buffer)
        const data = [
            { bit: 8, len: 4 },
            { bit: 0, len: 2 },
            { bit: 1 },
            { bit: 0 },
            { bit: 4, len: 3 },
            { bit: 1 },
            { bit: 0 },
            { bit: 0, len: 2 },
            { bit: 5, len: 3 },
            { bit: 2, len: 3 },
            { bit: 0b100100000000000, len: 15 },
            { bit: 0b010000000000000, len: 15 },
            { bit: 0b001000000000000, len: 15 },
        ]
        // このデータは11.7 technical description of the MatchIDの例だが、
        // すでにビット列が反転していることに注意（この例ではcubeValueは2なので
        // Bit1-4=’0001’だが、上記のドキュメントやdata[0].bitは'1000'になる
        data.reduce(reducer)
        expect(
            data.map((v) => v.len ?? 1).reduce((prev, n) => prev + n, 0)
        ).toBe(66)
        expect(Array.from(new Uint8Array(buffer))).toEqual([
            0x41, 0x89, 0x2a, 0x01, 0x20, 0x00, 0x20, 0x00, 0x00,
        ])
    })

    test('reduces last bit properly', () => {
        const buffer = new ArrayBuffer(2)
        const reducer = littleEndianReducer(buffer)
        const data: Bit[] = [
            { bit: 6, len: 3 },
            { bit: 1, len: 2 },
        ]
        data.reduce(reducer)
        expect(Array.from(new Uint8Array(buffer))).toEqual([19, 0])
    })
    test('reduces last bit properly(long bits)', () => {
        const buffer = new ArrayBuffer(2)
        const reducer = littleEndianReducer(buffer)
        const data: Bit[] = [
            { bit: 6, len: 3 },
            { bit: 1, len: 8 },
        ]
        data.reduce(reducer)
        expect(Array.from(new Uint8Array(buffer))).toEqual([3, 4])
    })
})

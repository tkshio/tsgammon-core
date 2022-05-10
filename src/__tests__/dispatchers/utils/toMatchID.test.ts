import { boardState } from '../../../BoardState'
import { cube, CubeOwner } from '../../../CubeState'
import {
    cbActionRed,
    cbActionWhite,
    cbInPlayRed,
    cbInPlayWhite,
    cbResponseRed,
    cbResponseWhite,
    cbToRollRed,
    cbToRollWhite,
} from '../../../dispatchers/CubeGameState'
import { GameState } from '../../../dispatchers/GameState'
import { MatchState } from '../../../dispatchers/MatchState'
import {
    ResignOffer,
    rsNone,
    rsOfferedRed,
} from '../../../dispatchers/ResignState'
import {
    inPlayStateRed,
    inPlayStateWhite,
    toRollStateRed,
    toRollStateWhite,
} from '../../../dispatchers/SingleGameState'
import {
    Bit,
    littleEndianReducer,
    toMatchID,
} from '../../../dispatchers/utils/toMatchID'
import { score } from '../../../Score'

describe('toMatchID()', () => {
    test('encodes matchState', () => {
        const matchState: MatchState = {
            matchLength: 9,
            matchScore: score({ redScore: 2, whiteScore: 4 }),
            gameState: {
                tag: 'GSInPlay',
                isCrawford: false,
                rsState: rsNone(),
                cbState: cbInPlayWhite(cube(2, CubeOwner.RED, 16)),
                sgState: inPlayStateWhite(boardState(), { dice1: 5, dice2: 2 }),
            },
            isJacoby: false,
        }

        const matchID = toMatchID(matchState).matchID
        expect(matchID).toEqual('QYkqASAAIAAE')
    })

    const _gameState: GameState = {
        tag: 'GSInPlay',
        isCrawford: false,
        rsState: rsNone(),
        cbState: cbToRollRed(cube(1), 'Skip'),
        sgState: toRollStateRed(boardState()),
    }
    const _matchState: MatchState = {
        matchLength: 0,
        matchScore: score(),
        gameState: _gameState,
        isJacoby: true,
    }

    test('encodes opening state of unlimited game with red6/white4', () => {
        const {
            matchID,
            //, ...matchInfo
        } = toMatchID(_matchState)
        //console.log(matchInfo)
        //console.log(decodeMatchID('MAEAAAAAAAAA'))
        expect(matchID).toEqual('MAEAAAAAAAAA')
    })
    test('encodes cube=4', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbToRollRed(cube(4), 'Skip'),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('MgEAAAAAAAAA')
    })
    test('encodes cube owned by red', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbToRollRed(cube(4, CubeOwner.RED), 'Skip'),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('AgEAAAAAAAAA')
    })
    test('encodes cube owned by white', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbToRollRed(cube(4, CubeOwner.WHITE), 'Skip'),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('EgEAAAAAAAAA')
    })
    test('encodes white to roll', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbToRollWhite(cube(4, CubeOwner.WHITE), 'Skip'),
            sgState: toRollStateWhite(boardState()),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('UgkAAAAAAAAA')
    })
    test('encodes white to play cube action', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbActionWhite(cube(4, CubeOwner.WHITE)),
            sgState: toRollStateWhite(boardState()),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('UgkAAAAAAAAA')
    })
    test('encodes white to play cube response', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbResponseWhite(cube(1)),
            sgState: toRollStateRed(boardState()),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('MBkAAAAAAAAA')
    })
    test('encodes white to play checker', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbInPlayWhite(cube(4, CubeOwner.WHITE)),
            sgState: inPlayStateWhite(boardState(), { dice1: 5, dice2: 3 }),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('UokOAAAAAAAA')
    })
    test("encodes white to play checker(reverted roll won't change matchID)", () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbInPlayWhite(cube(4, CubeOwner.WHITE)),
            sgState: inPlayStateWhite(boardState(), { dice1: 3, dice2: 5 }),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('UokOAAAAAAAA') // Gnu Backgammon doesn't change matchID
    })

    test('encodes red to roll', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbToRollRed(cube(1), 'Skip'),
            sgState: toRollStateRed(boardState()),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('MAEAAAAAAAAA')
    })
    test('encodes red to play cube action', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbActionRed(cube(1)),
            sgState: toRollStateRed(boardState()),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('MAEAAAAAAAAA')
    })
    test('encodes red to play cube response', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbResponseRed(cube(1)),
            sgState: toRollStateWhite(boardState()),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('cBEAAAAAAAAA')
    })
    test('encodes red to play checker', () => {
        const gameState: GameState = {
            ..._gameState,
            cbState: cbInPlayRed(cube(1)),
            sgState: inPlayStateRed(boardState(), { dice1: 5, dice2: 3 }),
        }
        const matchState = {
            ..._matchState,
            gameState,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('MIEOAAAAAAAA')
    })
    test('encodes crawford', () => {
        const gameState: GameState = {
            ..._gameState,
            isCrawford: true,
            cbState: cbToRollRed(cube(1), 'Skip'),
            sgState: toRollStateRed(boardState()),
        }
        const matchState = {
            ..._matchState,
            matchLength: 1,
            gameState,
            isJacoby: false,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('sAEgAAAAAAAE')
    })
    test('white offers to resign a backgammon', () => {
        const gameState: GameState = {
            tag: 'GSInPlay',
            isCrawford: false,
            rsState: rsOfferedRed(ResignOffer.Backgammon),
            cbState: cbToRollWhite(cube(1), 'Skip'),
            sgState: toRollStateWhite(boardState()),
        }
        const matchState: MatchState = {
            matchLength: 5,
            matchScore: score(),
            gameState,
            isJacoby: false,
        }

        const { matchID } = toMatchID(matchState)
        expect(matchID).toEqual('cGGgAAAAAAAE')
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

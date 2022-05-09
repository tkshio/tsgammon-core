import { boardState } from '../../../BoardState'
import { cube, CubeOwner } from '../../../CubeState'
import { cbInPlayWhite } from '../../../dispatchers/CubeGameState'
import { inPlayStateWhite } from '../../../dispatchers/SingleGameState'
import {
    Bit,
    littleEndianReducer,
    toMatchID,
} from '../../../dispatchers/utils/toMatchID'
import { score } from '../../../Score'

describe('toMatchID()', () => {
    test('encodes matchState', () => {
        const matchID = toMatchID({
            matchLength: 9,
            matchScore: score({ redScore: 2, whiteScore: 4 }),
            gameState: {
                tag: 'GSInPlay',
                isCrawford: false,
                cbState: cbInPlayWhite(cube(2, CubeOwner.RED, 16)),
                sgState: inPlayStateWhite(boardState(), { dice1: 5, dice2: 2 }),
            },
        })
        expect(matchID).toEqual('QYkqASAAIAAA')
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

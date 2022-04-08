import { decodeMove, decodeMoves } from '../../utils/decodeMoveString'

const testDataMove = [
    {
        tag: 'DESC',
        s: '24/18',
        move: [1, 7],
    },
    {
        tag: 'ASC',
        s: '1/7',
        move: [1, 7],
    },
    {
        tag: 'BAR',
        s: 'BAR/22',
        move: [0, 3],
    },
    {
        tag: 'bar',
        s: 'bar/3',
        move: [0, 3],
    },
    {
        tag: 'off',
        s: '3/off',
        move: [22, 25],
    },
    {
        tag: 'OFF',
        s: '24/OFF',
        move: [24, 25],
    },
    {
        tag: 'isHit',
        s: '13/12*',
        move: [12, 13],
        isHit: true,
    },
    {
        tag: 'no /',
        s: '20OFF',
        move: [],
    },
]

describe('decodeMove', () => {
    test.each(testDataMove)('decodes $s ($tag)', (data) => {
        const move = decodeMove(data.s)
        expect(
            move.isValid
                ? { move: [move.from, move.to], isHit: move.isHit }
                : { move: [], isHit: false }
        ).toStrictEqual({ move: data.move, isHit: data.isHit === true })
    })
})

const testDataMoves = [
    {
        tag: 'SPACE',
        s: '24/18 23/12',
        moves: [{ move: [1, 7] }, { move: [2, 13] }],
    },
    {
        tag: 'redundant SPACES',
        s: '24/18    23/12',
        moves: [{ move: [1, 7] }, { move: [2, 13] }],
    },
    {
        tag: '(n) notation',
        s: '3/2*(2) 2/OFF(2)',
        moves: [
            { move: [22, 23], isHit: true },
            { move: [22, 23], isHit: true },
            { move: [23, 25], isBearoff: true },
            { move: [23, 25], isBearoff: true },
        ],
    },
    {
        tag: 'a/b/c notation',
        s: '3/4*/5 19/20/21/22/OFF', // too many?, don't care
        moves: [
            { move: [3, 4], isHit: true },
            { move: [4, 5] },
            { move: [19, 20] },
            { move: [20, 21] },
            { move: [21, 22] },
            { move: [22, 25], isBearoff: true },
        ],
    },
    {
        tag: 'mixed notation',
        s: '1/2/3(2)',
        moves: [
            { move: [1, 2] },
            { move: [2, 3] },
            { move: [1, 2] },
            { move: [2, 3] },
        ],
    },
    {
        tag: 'decode as valid',
        s: '1/2*/3(2) 4/5/6*(2) 22/off*',
        moves: [
            { move: [1, 2], isHit: true },
            { move: [2, 3] },
            { move: [1, 2], isHit: true },
            { move: [2, 3] },
            { move: [4, 5] },
            { move: [5, 6], isHit: true },
            { move: [4, 5] },
            { move: [5, 6], isHit: true },
            { move: [22, 25], isHit: true, isBearoff: true },
        ],
    },
    {
        tag: 'empty',
        s: '',
        moves: [],
    },
    {
        tag: 'space only',
        s: ' ',
        moves: [],
    },
]

describe('decodeMoves', () => {
    test.each(testDataMoves)('decodes $s ($tag)', (data) => {
        const moves = decodeMoves(data.s)
        expect(
            moves.map((move) => {
                return {
                    move: [move.from, move.to],
                    isHit: move.isHit,
                    isBearoff: move.isBearOff,
                }
            })
        ).toStrictEqual(
            data.moves.map((m) => ({ isHit: false, isBearoff: false, ...m }))
        )
    })
})

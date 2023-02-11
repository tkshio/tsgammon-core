import { boardState } from '../../BoardState'
import { standardConf } from '../../GameConfs'
import { toPositionID, toPositionIDFromArray } from '../../utils/toPositionID'

const positionIDTestData = [
    {
        title: 'encodes the opening position into 4HPwATDgc/ABMA',
        board: {
            pos: standardConf.initialPos,
        },
        expected: '4HPwATDgc/ABMA',
    },
    {
        title: 'encodes an ordinary position',
        board: {
            // prettier-ignore
            pos: [
                 0,
                 1, 0, 0, 0, 0, -5, 1, -3, 0, 0, 0,  4,
                -5, 1, 0, 0, 3,  0, 5,  0, 0, 0, 0, -2, 
                 0,
            ],
        },
        expected: '4HPwATDgc+RBIA',
    },
    {
        title: 'encodes a position with O on the bar',
        board: {
            // prettier-ignore
            pos: [
                 0,
                 1, 0, 0, 0, 0, -5, 1, -4, 0, 0, 0, 5,
                -4, 0, 0, 0, 3,  0, 4,  1, 0, 0, 0, -1, 
                 -1,
            ],
        },
        expected: '4PPgAVDQc/BBIA',
    },
    {
        title: 'encodes a position with X on the bar',
        board: {
            // prettier-ignore
            pos: [
                 1,
                 1, 0, 0, 0, 0, -5, 1, -4, 0, 0, 0, 5,
                -4, 0, 0, 0, 3, 0, 4, -1, -1, 0, 0, 0, 
                 0,
            ],
        },
        expected: '4PPgAQXgOfggUA',
    },
    {
        title: 'encodes a position with some pieces borne off',
        board: {
            // prettier-ignore
            pos: [
                0,
                -3, 0, -4, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 
                0,
            ],
            myBornOff: 11,
            oppBornOff: 8,
        },
        expected: '5wEAABsAAAAAAA',
    },
    {
        title: 'encodes a position with pieces over 8 on a single point',
        board: {
            // prettier-ignore
            pos: [
                11,
                -9, 0, -6, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 
                0,
            ],
        },
        expected: '//kBAAA2AADwfw',
    },
    {
        title: 'encodes a position with pieces over 8 on 2 consecutive points(opp bar and ace point)',
        board: {
            // prettier-ignore
            pos: [
                0,
                0, -6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0,  0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 11, 
                -9,
            ],
        },
        expected: 'fgAAwH//twEAAA',
    },
]
const invalidData = [
    {
        title: 'returns invalidFlag when there are too many pieces',
        board: {
            // prettier-ignore
            pos: [
                  0,
                -20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 
                  0,
            ],
        },
    },
    {
        title: 'encode uninitialized array',
        board: {
            // prettier-ignore
            pos: new Array(5),
        },
    },
]

describe('encode PositionID', () => {
    /* eslint jest/expect-expect: ["error", { "assertFunctionNames":
     ["encodePositionID","encodeInvalidData"] }] */
    test.each(positionIDTestData)('$title', (data) => encodePositionID(data))
    test.each(invalidData)('$title', (data) => encodeInvalidData(data))
})

function encodePositionID(data: {
    board: {
        pos: number[]
        myBornOff?: number
        oppBornOff?: number
    }
    expected: string
}) {
    const { myBornOff = 0, oppBornOff = 0 } = data.board

    const board = boardState(data.board.pos, [myBornOff, oppBornOff])
    expect(toPositionID(board)).toStrictEqual(data.expected)
}

function encodeInvalidData(data: {
    board: {
        pos: number[]
    }
}) {
    // 何か返ってくれば良い
    expect(toPositionIDFromArray(data.board.pos)).toBeTruthy()
}

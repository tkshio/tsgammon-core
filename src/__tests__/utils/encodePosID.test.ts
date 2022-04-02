import { boardState } from '../../BoardState'
import { standardConf } from '../../GameConf'
import { encodePosID } from '../../utils/encodePosID'

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
        expected: '',
    },
]

describe('encode PositionID', () => {
    /* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["testEncodePositionID"] }] */
    test.each(positionIDTestData)('$title', (data) => {
        testEncodePositionID(data)
    })
})

function testEncodePositionID(data: {
    board: {
        pos: number[]
        myBornOff?: number
        oppBornOff?: number
    }
    expected: string
}) {
    const { myBornOff = 0, oppBornOff = 0 } = data.board

    const board = boardState(data.board.pos, [myBornOff, oppBornOff])
    expect(encodePosID(board)).toStrictEqual(
        data.expected
            ? { isValid: true, positionID: data.expected }
            : { isValid: false }
    )
}

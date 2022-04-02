import { boardState } from '../../BoardState'
import { decodePosID } from '../../utils/decodePosID'
import { encodePosID } from '../../utils/encodePosID'

const decodePosIDTestData = [
    // positions relys on encodePosID()
    { title: 'decodes opening position', str: '4HPwATDgc/ABMA' },
    { title: 'decodes only first 14 letters', str: '4HPwATDgc/ABMAXAaoeu' },
    { title: 'decodes a position with O on the bar', str: '4PPgAVDQc/BBIA' },
    { title: 'decodes a position with X on the bar', str: '4PPgAQXgOfggUA' },
    {
        title: 'decodes a position with some pieces borne off',
        str: '5wEAABsAAAAAAA',
    },
    {
        title: 'decodes a position with pieces over 8 on a single point',
        str: '//kBAAA2AADwfw',
    },
    {
        title: 'decodes a position with pieces over 8 on 2 consecutive points(opp bar and ace point)',
        str: 'fgAAwH//twEAAA',
    },
]

const invalidCase = [
    {
        title: "doesn't decode strings too short",
        str: '4HPwA',
    },
    {
        title: "doesn't decode empty string",
        str: '',
    },
]

const unReencodable = [
    {
        title: 'decodes something from unsupported char',
        str: '----------------------------',
    },
    {
        title: 'decodes something from insufficient string',
        str: '---AAA----------------------',
    },
]

describe('decode PositionID', () => {
    /* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["testDecodePositionID","testInvalidCase","testUnReencodable"] }] */
    test.each(decodePosIDTestData)('$title', (data) => {
        testDecodePositionID(data)
    })
    test.each(invalidCase)('$title', (data) => {
        testInvalidCase(data)
    })
    test.each(unReencodable)('$title', (data) => {
        testUnReencodable(data)
    })
})

function testDecodePositionID(data: { str: string }) {
    const decoded = decodePosID(data.str)
    expect(decoded.isValid).toEqual(true)

    const pos = decoded.isValid ? decoded.pos : []
    expect(pos).toHaveLength(26)

    const reenc = encodePosID(boardState(pos, [0, 0]))
    expect(reenc).toEqual({
        isValid: true,
        positionID: data.str.substring(0, 14),
    })
}
function testInvalidCase(data: { str: string }) {
    const decoded = decodePosID(data.str)
    expect(decoded.isValid).toEqual(false)
}

function testUnReencodable(data: { str: string }) {
    const decoded = decodePosID(data.str)
    expect(decoded.isValid).toEqual(true)
    const pos = decoded.isValid ? decoded.pos : []
    expect(pos).toHaveLength(26)

    const reenc = encodePosID(boardState(pos, [0, 0]))
    expect(reenc.isValid).toBeFalsy()
}

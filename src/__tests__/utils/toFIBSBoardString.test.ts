import { boardState } from '../../BoardState'
import { toFIBSBoard } from '../../utils/toFIBSBoardString'
import { testData } from './FIBSBoard.data'

describe('encode BoardState', () => {
    test.each(testData)('encodes $title', (data) => {
        const { myBearOff = 0, oppBearOff = 0 } = data
        const board = boardState(data.pos, [myBearOff, oppBearOff])
        const opt = {
            colour: data.colour,
            direction: data.direction,
            turn: data.turn,
        }
        expect(toFIBSBoard(board, opt)).toStrictEqual(data.fibs)
    })
})

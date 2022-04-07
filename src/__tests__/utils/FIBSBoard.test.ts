import {
    COLOUR,
    encodeFIBSBoardString,
    initBoard,
    TURN,
} from '../../utils/FIBSBoardString'

describe('encoder', () => {
    it('encodes example in spec description', () => {
        const player = 'You'
        const opponent = 'someplayer'
        const board = initBoard({
            matchLen: 3,
            colour: COLOUR.O,
            turn: TURN.O,
            dice1: 6,
            dice2: 2,
            canMove: 2,
        })
        expect(encodeFIBSBoardString(board, player, opponent)).toStrictEqual(
            'board:You:someplayer:3:0:0:0:-2:0:0:0:0:5:0:3:0:0:0:-5:5:0:0:0:-3:0:-5:0:0:0:0:2:0:1:6:2:0:0:1:1:1:0:1:-1:0:25:0:0:0:0:2:0:0:0'
        )
    }),
        it('throws exception if length of pos array is not 26', () => {
            const pos = Array(27).fill('1')
            expect(() => encodeFIBSBoardString(initBoard({ pos }))).toThrow()
        })
})

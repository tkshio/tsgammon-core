import { decodeMatchID } from '../../../dispatchers/utils/decodeMatchID'

describe('decodeMatchID()', () => {
    test('decodes matchID', () => {
        const matchState = decodeMatchID('QYkqASAAIAAA')
        expect(matchState).toStrictEqual({
            cube: 1,
            cubeOwner: 0,
            diceOwner: 1,
            crawford: 0,
            gameState: 1,
            turnOwner: 1,
            double: 0,
            resign: 0,
            dice1: 5,
            dice2: 2,
            matchLen: 9,
            score1: 2,
            score2: 4,
            noJacoby: 0,
        })
    })
})

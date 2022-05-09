import { boardState } from '../../../BoardState'
import { cube, CubeOwner } from '../../../CubeState'
import { cbInPlayWhite } from '../../../dispatchers/CubeGameState'
import { inPlayStateWhite } from '../../../dispatchers/SingleGameState'
import { toMatchID } from '../../../dispatchers/utils/toMatchID'
import { score } from '../../../Score'

describe('toMatchID()', () => {
    test('encodes matchState', () => {
        const matchID = toMatchID({
            matchLength: 9,
            matchScore: score({ redScore: 2, whiteScore: 4 }),
            gameState: {
                tag: 'GSInPlay',
                isCrawford: false,
                cbState: cbInPlayWhite(cube(2, CubeOwner.RED)),
                sgState: inPlayStateWhite(boardState(), { dice1: 5, dice2: 2 }),
            },
        })
        expect(matchID).toEqual('QYkqASAAIAAA')
    })
})

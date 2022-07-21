import { cube, CubeOwner } from '../CubeState'
import { isCubeMaxForMatch, matchStateForPointMatch } from '../MatchState'
import { score } from '../Score'

describe('isCubeMaxForMatch()', () => {
    test('returns false when cube is not owned and match is not double match point', () => {
        const matchState = matchStateForPointMatch(
            3,
            score({ redScore: 2, whiteScore: 0 }),
            false
        )
        const cubeState = cube(1)
        expect(isCubeMaxForMatch(matchState, cubeState)).toBeFalsy()
    })
    test('returns true when cube is not owned and match is double match point', () => {
        const matchState = matchStateForPointMatch(
            3,
            score({ redScore: 2, whiteScore: 2 }),
            false
        )
        const cubeState = cube(1)
        expect(isCubeMaxForMatch(matchState, cubeState)).toBeTruthy()
    })
    test('returns true when cube is owned by red and cube value + red pt >= match point', () => {
        const matchState = matchStateForPointMatch(
            3,
            score({ redScore: 1, whiteScore: 0 }),
            false
        )
        const cubeState = cube(2, CubeOwner.RED)
        expect(isCubeMaxForMatch(matchState, cubeState)).toBeTruthy()
    })
    test('returns true when cube is owned by white and cube value + white pt >= match point', () => {
        const matchState = matchStateForPointMatch(
            7,
            score({ redScore: 0, whiteScore: 4 }),
            false
        )
        const cubeState = cube(4, CubeOwner.WHITE)
        expect(isCubeMaxForMatch(matchState, cubeState)).toBeTruthy()
    })
    test('returns false when cube is owned by red and cube value + red pt < match point', () => {
        const matchState = matchStateForPointMatch(
            3,
            score({ redScore: 0, whiteScore: 2 }),
            false
        )
        const cubeState = cube(2, CubeOwner.RED)
        expect(isCubeMaxForMatch(matchState, cubeState)).toBeFalsy()
    })
    test('returns false when cube is owned by white and cube value + white pt < match point', () => {
        const matchState = matchStateForPointMatch(
            3,
            score({ redScore: 2, whiteScore: 0 }),
            false
        )
        const cubeState = cube(2, CubeOwner.WHITE)
        expect(isCubeMaxForMatch(matchState, cubeState)).toBeFalsy()
    })
})

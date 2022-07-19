import {
    matchStateForPointMatch,
    matchStateForUnlimitedMatch,
    shouldSkipCubeAction,
} from '../../MatchState'
import { score } from '../../Score'

describe('shouldSkipCubeAction', () => {
    test('returns false when cube+curScore < match point(red)', () => {
        const matchState = matchStateForPointMatch(
            3,
            score({ redScore: 1, whiteScore: 0 })
        )
        const result = shouldSkipCubeAction(matchState, 1, true)
        // 1(red) + 1(cube) < 2
        expect(result).toBeFalsy()
        expect(shouldSkipCubeAction(matchState, 1, false)).toBeFalsy()
    })
    test('returns true when cube+curScore = match point(white)', () => {
        const matchState = matchStateForPointMatch(
            3,
            score({ redScore: 0, whiteScore: 2 })
        )
        const result = shouldSkipCubeAction(matchState, 1, false)
        // 2(white) + 1(cube) == 3
        expect(result).toBeTruthy()
        expect(shouldSkipCubeAction(matchState, 1, true)).toBeFalsy()
    })
    test('returns true when cube+curScore > match point(red)', () => {
        const matchState = matchStateForPointMatch(
            3,
            score({ redScore: 2, whiteScore: 0 })
        )
        const result = shouldSkipCubeAction(matchState, 2, true)
        // 2(red) + 2(cube) > 3
        expect(result).toBeTruthy()
        expect(shouldSkipCubeAction(matchState, 1, false)).toBeFalsy()
    })
    test('always returns false for unlimited', () => {
        const matchState = matchStateForUnlimitedMatch(
            score({ redScore: 2, whiteScore: 0 })
        )
        const result = shouldSkipCubeAction(matchState, 2, true)
        // 2(red) + 2(cube) > -1
        expect(result).toBeFalsy()
        expect(shouldSkipCubeAction(matchState, 1, false)).toBeFalsy()
    })
    test('always returns true for crawford', () => {
        const matchState = matchStateForPointMatch(
            3,
            score({ redScore: 2, whiteScore: 0 }),
            true
        )
        const result = shouldSkipCubeAction(matchState, 1, true)
        // 2(red) + 1(cube) ==3
        expect(result).toBeTruthy()
        // 0(white) + 1(cube) < 3
        expect(shouldSkipCubeAction(matchState, 1, false)).toBeTruthy()
    })
})

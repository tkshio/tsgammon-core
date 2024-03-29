import { FIBSCube } from '../../utils/FIBSCube'
import { decodeFIBS } from '../../utils/decodeFIBS'
import { COLOUR, TURN } from '../../utils/FIBSBoard'
import { FIBSScore } from '../../utils/FIBSState'
import { testData, testDataWithRoll } from './FIBSBoard.data'

describe('decode', () => {
    test.each(testData)('decodes $title', (data) => {
        const fibs = decodeFIBS(data.fibs)

        if (!fibs.isValid) {
            throw new Error('invalid format')
        }
        const node = fibs.node
        const pos = adjustPos(data)
        expect(node.board.points).toStrictEqual(pos)
        expect(node.dices).toStrictEqual([])

        testCube(fibs.cube, data.cube)
        testScore(fibs.matchScore, data.matchScore)
    })
    test.each(testDataWithRoll)('decodes $title', (data) => {
        const fibs = decodeFIBS(data.fibs)

        if (!fibs.isValid) {
            throw new Error('invalid format')
        }
        const node = fibs.node
        expect(node.board.points).toStrictEqual(adjustPos(data))
        expect(node.dices.map((dice) => dice.pip).sort()).toStrictEqual(
            data.roll.dice1 === data.roll.dice2
                ? [
                      data.roll.dice1,
                      data.roll.dice1,
                      data.roll.dice1,
                      data.roll.dice1,
                  ]
                : [data.roll.dice1, data.roll.dice2].sort()
        )
        expect(node.board.myBornOff).toEqual(data.myBearOff ?? 0)
        expect(node.board.opponentBornOff).toEqual(data.oppBearOff ?? 0)
        testCube(fibs.cube, data.cube)
        testScore(fibs.matchScore, data.matchScore)
    })
})

function testCube(cube: FIBSCube, expected?: FIBSCube) {
    const {
        cubeValue = 1,
        playerMayDouble = true,
        opponentMayDouble = true,
    } = { ...expected }
    expect(cube.cubeValue).toBe(cubeValue)
    expect(cube.playerMayDouble).toEqual(playerMayDouble)
    expect(cube.opponentMayDouble).toEqual(opponentMayDouble)
}
function testScore(score: FIBSScore, expected?: FIBSScore) {
    const {
        matchLen: matchLength = 9999,
        playerScore: player = 0,
        opponentScore: opponent = 0,
    } = { ...expected }
    expect(score.matchLen).toBe(matchLength)
    expect(score.playerScore).toBe(player)
    expect(score.opponentScore).toBe(opponent)
}
// テスト条件で、手番プレイヤーが自分ではない場合、盤面を反転させる
function adjustPos(data: {
    pos: number[]
    colour?: COLOUR
    turn?: TURN
}): number[] {
    // colourは省略時にはXになる
    const { colour = COLOUR.X } = data

    // turnは省略時にはcolourと同じなので、undefinedの時は反転の必要がない
    return (colour === COLOUR.O && data.turn === TURN.X) ||
        (colour === COLOUR.X && data.turn === TURN.O)
        ? data.pos
              .map((_, idx, arr) => arr[arr.length - 1 - idx])
              .map((n) => (n === 0 ? 0 : -n))
        : data.pos
}

import { decodeFIBS } from '../../utils/decodeFIBS'
import { COLOUR, TURN } from '../../utils/FIBSBoard'
import { testData, testDataWithRoll } from './FIBSBoard.data'

describe('decode', () => {
    test.each(testData)('decodes $title', (data) => {
        const node = decodeFIBS(data.fibs)

        if (!node.hasValue) {
            throw new Error('invalid format')
        }
        const pos = adjustPos(data)
        expect(node.board.points()).toStrictEqual(pos)
        expect(node.dices).toStrictEqual([])
    })

    test.each(testDataWithRoll)('decodes $title', (data) => {
        const node = decodeFIBS(data.fibs)

        if (!node.hasValue) {
            throw new Error('invalid format')
        }
        expect(node.board.points()).toStrictEqual(adjustPos(data))
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
        expect(node.board.myBornOff()).toEqual(data.myBearOff ?? 0)
        expect(node.board.opponentBornOff()).toEqual(data.oppBearOff ?? 0)
    })
})

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

import { presetDiceSource } from '../utils/DiceSource'
import { DicePip } from '../Dices'

type TestArgs = {
    preset: DicePip[]
    expected: DicePip[][]
    action: 'roll' | 'openingRoll'
}

test('presetDiceSource', () => {
    const arg: TestArgs = {
        preset: [1, 2, 3, 2, 6, 1, 3, 3, 2, 4],
        expected: [
            [1, 2],
            [3, 2],
            [6, 1],
            [3, 3],
            [2, 4],
        ],
        action: 'roll',
    }
    doTest(arg)
})

test('presetDiceSource(with openingRolls)', () => {
    const arg: TestArgs = {
        preset: [1, 2, 3, 2, 6, 1, 3, 3, 2, 4],
        expected: [
            [1, 2],
            [3, 2],
            [6, 1], // 3,3はスルー
            [2, 4],
        ],
        action: 'openingRoll',
    }
    doTest(arg)
})

function doTest(arg: TestArgs) {
    const diceSource = presetDiceSource(...arg.preset)

    arg.expected.forEach((diceRoll: DicePip[]) => {
        expect(diceSource[arg.action]()).toEqual({
            dice1: diceRoll[0],
            dice2: diceRoll[1],
        })
    })

    expect(diceSource.roll()).toBeTruthy() //何か値が返っていればよし
}

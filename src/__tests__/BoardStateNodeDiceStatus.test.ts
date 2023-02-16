import { boardStateNodeFromArray } from '../BoardStateNodeBuilders'
import { DicePip } from '../Dices'
import { standardConf } from '../GameConfs'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'
import { wrapNode, wrapRootNode } from '../utils/wrapNode'
import { BoardStateNode } from '../BoardStateNode'

type DiceTestArg = {
    pos: number[]
    diceRoll: [DicePip, DicePip]
    clicks: {
        pos?: number // クリックする場所
        isMinor?: boolean // 小の目を優先する場合はtrue
        used: boolean[] // diceRollの各要素の使用状態
        forced?: boolean // そのままの順でダイスを使う(=node.swappedが設定されない)ならtrue、省略時もtrue扱い
    }[][]
}

const diceStatusTest: { name: string; args: DiceTestArg }[] = [
    {
        name: 'changes dice status for sub nodes',
        args: {
            pos: [
                0, 1, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 3],
            clicks: [
                [
                    { used: [false, false], forced: false },
                    { pos: 1, used: [true, false] },
                    { pos: 4, used: [true, true] },
                ],
                [
                    { used: [false, false], forced: false },
                    { pos: 1, isMinor: true, used: [true, false] },
                    { pos: 2, used: [true, true] },
                ],
            ],
        },
    },
    {
        name: 'changes dice status for sub nodes (keep dice order)',
        args: {
            pos: [
                0, 1, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [3, 1],
            clicks: [
                [
                    { used: [false, false], forced: false },
                    { pos: 1, used: [true, false] },
                    { pos: 4, used: [true, true] },
                ],
                [
                    { used: [false, false], forced: false },
                    { pos: 1, isMinor: true, used: [true, false] },
                    { pos: 2, used: [true, true] },
                ],
            ],
        },
    },
    {
        name: 'changes dice status for sub nodes (eog)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 0, 0, 1, 0, 0, 0,
            ],
            diceRoll: [3, 1],
            clicks: [
                [
                    { used: [false, false], forced: false },
                    { pos: 22, used: [true, true] },
                ],
                [
                    { used: [false, false], forced: false },
                    { pos: 22, isMinor: true, used: [true, false] },
                ],
            ],
        },
    },
    {
        name: "can't use both dice at once",
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 1, 0, 0, -2, 0, 0,
            ],
            diceRoll: [2, 1],
            // must use larger pip
            clicks: [
                [
                    { used: [false, true], forced: true },
                    { pos: 20, used: [true, true], forced: true },
                ],
            ],
        },
    },
    {
        name: "can't use higher number",
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 1, 0, -2, -2, 0, 0,
            ],
            diceRoll: [2, 1],
            // ダイスは1→2の順で1のみが未使用
            clicks: [
                // 小の目先行なら動かせる
                [
                    { used: [false, true], forced: true },
                    {
                        pos: 20,
                        isMinor: true,
                        used: [true, true],
                        forced: true,
                    },
                ],
            ],
        },
    },
    {
        name: "can't use lower number (eog)",
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 0, 0, 0, 1, -2, 0,
            ],
            diceRoll: [2, 1],
            clicks: [
                [
                    { used: [false, true], forced: true },
                    { pos: 23, used: [true, true], forced: true },
                ],
            ],
        },
    },
    {
        name: 'may use any dice (eog)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 0, 0, 0, 0, 1, 0,
            ],
            diceRoll: [2, 1],
            clicks: [
                [
                    { used: [false, false], forced: false },
                    { pos: 24, used: [true, true] },
                ],
                [
                    { used: [false, false], forced: false },
                    { pos: 24, isMinor: true, used: [true, true] },
                ],
            ],
        },
    },
]
const diceStatusTestDoublet: { name: string; args: DiceTestArg }[] = [
    {
        name: 'changes dice status for sub nodes (doublets)',
        args: {
            pos: [
                0, 1, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 1],
            clicks: [
                [
                    { used: [false, false, false, false] },
                    { pos: 1, used: [true, false, false, false] },
                    { pos: 2, used: [true, true, false, false] },
                    { pos: 3, used: [true, true, true, false] },
                    { pos: 4, used: [true, true, true, true] },
                ],
            ],
        },
    },
    {
        name: 'changes dice status for sub nodes (eog and doublet)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 0, 0, 1, 0, 0, 0,
            ],
            diceRoll: [3, 3],
            clicks: [
                [
                    { used: [false, true, true, true] },
                    { pos: 22, used: [true, true, true, true] },
                ],
            ],
        },
    },
    {
        name: 'changes dice status for sub nodes (eog and doublet, use 2)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 1, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [3, 3],
            clicks: [
                [
                    { used: [false, false, true, true] },
                    { pos: 19, used: [true, false, true, true] },
                    { pos: 22, used: [true, true, true, true] },
                ],
            ],
        },
    },
    {
        name: 'changes dice status for sub nodes (eog and doublet, use 3)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
                /*bar*/ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [3, 3],
            clicks: [
                [
                    { used: [false, false, false, true] },
                    { pos: 16, used: [true, false, false, true] },
                    { pos: 19, used: [true, true, false, true] },
                    { pos: 22, used: [true, true, true, true] },
                ],
            ],
        },
    },
    {
        name: 'changes dice status for sub nodes (eog and doublet, use all)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
                /*bar*/ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [3, 3],
            clicks: [
                [
                    { used: [false, false, false, false] },
                    { pos: 13, used: [true, false, false, false] },
                    { pos: 16, used: [true, true, false, false] },
                    { pos: 19, used: [true, true, true, false] },
                    { pos: 22, used: [true, true, true, true] },
                ],
            ],
        },
    },
    {
        name: 'can use 1 dice (doublet)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 1, 0, 0, -2, -2, 0,
            ],
            diceRoll: [2, 2],
            clicks: [
                [
                    { used: [false, true, true, true] },
                    { pos: 20, used: [true, true, true, true] },
                ],
            ],
        },
    },
    {
        name: 'can use 2 dice (doublet)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 2, 0, 0, -2, -2, 0,
            ],
            diceRoll: [2, 2],
            clicks: [
                [
                    { used: [false, false, true, true] },
                    { pos: 20, used: [true, false, true, true] },
                    { pos: 20, used: [true, true, true, true] },
                ],
            ],
        },
    },
    {
        name: 'can use 3 dice (doublet)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /*bar*/ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                /*bar*/ 0, 3, 0, 0, -2, -2, 0,
            ],
            diceRoll: [2, 2],
            clicks: [
                [
                    { used: [false, false, false, true] },
                    { pos: 20, used: [true, false, false, true] },
                    { pos: 20, used: [true, true, false, true] },
                    { pos: 20, used: [true, true, true, true] },
                ],
            ],
        },
    },
]

describe('Dice status test', () => {
    testDiceStatus(diceStatusTest)
})
describe('Dice status test (doublet)', () => {
    testDiceStatus(diceStatusTestDoublet)
})

function testDiceStatus(testConds: { name: string; args: DiceTestArg }[]) {
    testConds.forEach(({ name, args }: { name: string; args: DiceTestArg }) => {
        // eslint-disable-next-line jest/valid-title
        test(name, () => {
            args.clicks.forEach((click) => {
                let node: BoardStateNodeRoot | BoardStateNode =
                    boardStateNodeFromArray(
                        args.pos,
                        args.diceRoll[0],
                        args.diceRoll[1],
                        standardConf.transition.ruleSet
                    )

                click.forEach((co) => {
                    if (co.pos) {
                        const target = wrapNode(node, co.isMinor ?? false)
                        const found = target.apply((node) =>
                            node.childNode(co.pos!)
                        ).unwrap
                        if (found.hasValue) {
                            node = found
                        }
                    }
                    // co.forcedがtrue、または省略されている場合は、
                    // 小の目を先にプレイするという入れ替えの選択肢が提供されない
                    expect(node.isRoot && node.swapped == undefined).toBe(
                        node.isRoot && (co.forced || co.forced == undefined)
                    )
                    expect(node.dices.map((dice) => dice.used)).toEqual(co.used)
                })
            })
        })
    })
}

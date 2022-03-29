import { BoardStateNode, boardStateNodeFromArray } from "../BoardStateNode";
import { DicePip } from "../Dices";

type DiceTestArg = {
    pos: number[]
    diceRoll: [DicePip, DicePip]
    clicks: { pos?: number, isMinor?: boolean, used: boolean[] }[][]
}

const diceStatusTest: { name: string, args: DiceTestArg }[] = [{
    name: 'changes dice status for sub nodes',
    args: {
        pos: [0,
            1, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0],
        diceRoll: [1, 3],
        clicks: [
            [
                { used: [false, false] },
                { pos: 1, used: [true, false] },
                { pos: 4, used: [true, true] },
            ], [
                { used: [false, false] },
                { pos: 1, isMinor: true, used: [true, false] },
                { pos: 2, used: [true, true] },
            ]
        ]
    }
}, {
    name: 'changes dice status for sub nodes (keep dice order)',
    args: {
        pos: [0,
            1, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0],
        diceRoll: [3, 1],
        clicks: [
            [
                { used: [false, false] },
                { pos: 1, used: [true, false] },
                { pos: 4, used: [true, true] },
            ], [
                { used: [false, false] },
                { pos: 1, isMinor: true, used: [true, false] },
                { pos: 2, used: [true, true] },
            ]
        ]
    }
}, {
    name: 'changes dice status for sub nodes (eog)',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 1, 0, 0,
            0],
        diceRoll: [3, 1],
        clicks: [
            [
                { used: [false, false] },
                { pos: 22, used: [true, true] },
            ],
            [
                { used: [false, false] },
                { pos: 22, isMinor: true, used: [true, false] },
            ],
        ]
    }
}, {
    name: 'can\'t use both dice at once',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 1, 0, 0, -2, 0,
            0],
        diceRoll: [2, 1],
        // must use larger pip
        clicks: [
            [
                { used: [false, true] },
                { pos: 20, used: [true, true] },
            ],
            [
                { used: [false, true] },
                { pos: 20, isMinor: true, used: [false, true] },
            ],
        ]
    }
}, {
    name: 'can\'t use larger dice',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 1, 0, -2, -2, 0,
            0],
        diceRoll: [2, 1],
        clicks: [
            [
                { used: [false, true] },
                { pos: 20, used: [false, true] },
            ],
            [
                { used: [false, true] },
                { pos: 20, isMinor: true, used: [true, true] },
            ],
        ]
    }
}, {
    name: 'can\'t use larger dice (inv)',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 1, 0, -2, -2, 0,
            0],
        diceRoll: [1, 2],
        clicks: [
            [
                { used: [false, true] },
                { pos: 20, used: [false, true] },
            ],
            [
                { used: [false, true] },
                { pos: 20, isMinor: true, used: [true, true] },
            ],
        ]
    }
},
]
const diceStatusTestDoublet: { name: string, args: DiceTestArg }[] = [{
    name: 'changes dice status for sub nodes (doublets)',
    args: {
        pos: [0,
            1, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0],
        diceRoll: [1, 1],
        clicks: [
            [
                { used: [false, false, false, false] },
                { pos: 1, used: [true, false, false, false] },
                { pos: 2, used: [true, true, false, false] },
                { pos: 3, used: [true, true, true, false] },
                { pos: 4, used: [true, true, true, true] },
            ],
        ]
    }
}, {
    name: 'changes dice status for sub nodes (eog and doublet)',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 1, 0, 0,
            0],
        diceRoll: [3, 3],
        clicks: [
            [
                { used: [true, true, true, false,] },
                { pos: 22, used: [true, true, true, true] },
            ],
        ]
    }
}, {
    name: 'changes dice status for sub nodes (eog and doublet, use 2)',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 1, 0, 0, 0, 0, 0,
            0],
        diceRoll: [3, 3],
        clicks: [
            [
                { used: [true, true, false, false,] },
                { pos: 19, used: [true, true, true, false,] },
                { pos: 22, used: [true, true, true, true] },
            ],
        ]
    }
}, {
    name: 'changes dice status for sub nodes (eog and doublet, use 3)',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 1, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0],
        diceRoll: [3, 3],
        clicks: [
            [
                { used: [true, false, false, false] },
                { pos: 16, used: [true, true, false, false,] },
                { pos: 19, used: [true, true, true, false,] },
                { pos: 22, used: [true, true, true, true] },
            ],
        ]
    }
}, {
    name: 'changes dice status for sub nodes (eog and doublet, use all)',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            1, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0],
        diceRoll: [3, 3],
        clicks: [
            [
                { used: [false, false, false, false] },
                { pos: 13, used: [true, false, false, false,] },
                { pos: 16, used: [true, true, false, false,] },
                { pos: 19, used: [true, true, true, false,] },
                { pos: 22, used: [true, true, true, true] },
            ],
        ]
    }
}, {
    name: 'can use 1 dice (doublet)',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 1, 0, 0, -2, -2,
            0],
        diceRoll: [2, 2],
        clicks: [
            [
                { used: [true, true, true, false,] },
                { pos: 20, used: [true, true, true, true] },
            ],
        ]
    }
}, {
    name: 'can use 2 dice (doublet)',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 2, 0, 0, -2, -2,
            0],
        diceRoll: [2, 2],
        clicks: [
            [
                { used: [true, true, false, false,] },
                { pos: 20, used: [true, true, true, false,] },
                { pos: 20, used: [true, true, true, true] },
            ],
        ]
    }
}, {
    name: 'can use 3 dice (doublet)',
    args: {
        pos: [0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,/*bar*/ 0, 3, 0, 0, -2, -2,
            0],
        diceRoll: [2, 2],
        clicks: [
            [
                { used: [true, false, false, false,] },
                { pos: 20, used: [true, true, false, false,] },
                { pos: 20, used: [true, true, true, false,] },
                { pos: 20, used: [true, true, true, true] },
            ],
        ]
    }
},
]

describe('Dice status test', () => testDiceStatus(diceStatusTest))
describe('Dice status test (doublet)', () => testDiceStatus(diceStatusTestDoublet))

function testDiceStatus(testConds: { name: string, args: DiceTestArg }[]) {
    testConds.forEach(({ name, args }: { name: string, args: DiceTestArg }) => {
        // eslint-disable-next-line jest/valid-title
        test(name, () => {

            args.clicks.forEach(click => {
                let node: BoardStateNode = boardStateNodeFromArray(args.pos, args.diceRoll[0], args.diceRoll[1])

                click.forEach(co => {
                    if (co.pos) {
                        const major = co.isMinor ? node.minorFirst(co.pos) : node.majorFirst(co.pos)
                        node = major.hasValue ? major : node
                    }
                    expect(node.dices.map(dice => dice.used)).toEqual(co.used)
                })
            })
        })
    })
}

import { boardStateNodeFromArray } from '../BoardStateNode'
import { collectMoves } from '../utils/collectMoves'
import { DicePip } from '../Dices'
import { Move } from '../Move'
import { move, sortMoves } from './BoardStateNode.common'

type Moves = [number, number, boolean?][]
type BasicTestArg = {
    pos: number[]
    diceRoll: [DicePip, DicePip]
    expectedMoves: Moves[]
    expectedRedundancy?: boolean[]
}

const basicTestItems: { name: string; args: BasicTestArg }[] = [
    {
        name: "Can't go into blocked points",
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 2, 0, -2, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [13, 14],
                    [14, 16],
                ],
            ],
            expectedRedundancy: [false],
        },
    },
    {
        name: 'Must move pieces on the bar first',
        args: {
            pos: [
                1, 1, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [0, 1],
                    [1, 3],
                ], // dup 0/3
                [
                    [0, 2],
                    [1, 2],
                ],
                [
                    [0, 2],
                    [2, 3],
                ], // 0/3
            ],
            expectedRedundancy: [true, false, false],
        },
    },
    {
        name: "You can't move when shut out",
        args: {
            pos: [
                1, -2, -2, -2, -2, -2, -2, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [[]],
            expectedRedundancy: [false],
        },
    },
    {
        name: "You can't move when shut out(doublet)",
        args: {
            pos: [
                1, -2, -2, -2, -2, -2, -2, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [2, 2],
            expectedMoves: [[]],
            expectedRedundancy: [false],
        },
    },
    {
        name: 'Ignore unusable rolls (use major roll)',
        args: {
            pos: [
                0, 1, -2, 0, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [[[1, 3]]],
            expectedRedundancy: [false],
        },
    },
    {
        name: 'Ignore unusable rolls (use minor roll)',
        args: {
            pos: [
                0, 1, 0, -2, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [[[1, 2]]],
            expectedRedundancy: [false],
        },
    },
    {
        name: 'Must use both rolls',
        args: {
            pos: [
                0, 0, -2, 0, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 1, 0, /* bar */ 0, 0, 1, -2, 0, 0, 0,
            ],
            diceRoll: [5, 2],
            expectedMoves: [
                [
                    [17, 19],
                    [19, 24],
                ],
            ],
            // [21,23] is illegal
            expectedRedundancy: [false],
        },
    },
    {
        name: "Must use bigger one when both rolls couldn't be used at once",
        args: {
            pos: [
                0, 1, 0, 0, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [[[1, 3]]],
            // [1,2] is illegal
            expectedRedundancy: [false],
        },
    },
    {
        name: 'May use rolls in any order when both rolls are available',
        args: {
            pos: [
                0, 1, 0, 0, 0, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [1, 2],
                    [2, 4],
                ], // dup
                [
                    [1, 3],
                    [3, 4],
                ],
            ],
            expectedRedundancy: [true, false],
        },
    },
    {
        name: 'May use rolls in any order when both rolls are available(swapped roll)',
        args: {
            pos: [
                0, 1, 0, 0, 0, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [2, 1],
            expectedMoves: [
                [
                    [1, 2],
                    [2, 4],
                ], // dup
                [
                    [1, 3],
                    [3, 4],
                ],
            ],
            expectedRedundancy: [true, false],
        },
    },
    {
        name: 'Hit move must be marked',
        args: {
            pos: [
                0, 1, -1, -2, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [[[1, 2, true]]],
            expectedRedundancy: [false],
        },
    },
    {
        name: 'All pieces must be in inner board before bearing off',
        args: {
            pos: [
                0, 1, -1, -2, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 1, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [[[1, 2, true]]],
            // [24,off] is illegal
            expectedRedundancy: [false],
        },
    },
    {
        name: 'All pieces must be in inner board before bearing off 2',
        args: {
            pos: [
                0, 0, -1, -2, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, /* bar */ 0, 0, 0, 0, 1, 1, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [23, 24],
                    [24, 26],
                ],
                [
                    [23, 25],
                    [24, 25],
                ], // 24/25 24/25
                [
                    [24, 25],
                    [23, 25],
                ], // dup
            ],
            expectedRedundancy: [false, false, true],

            // you don't have to bear off all pieces
        },
    },
    {
        name: 'All pieces must be in inner board before bearing off 3',
        args: {
            pos: [
                0, 0, -1, -2, -2, -2, -2, /* bar */ -2, 0, 0, 0, 0, 0, 0, 1, 0,
                0, 0, 0, /* bar */ 0, 0, 0, 0, 1, 0, 0,
            ],
            diceRoll: [2, 5],
            expectedMoves: [
                [
                    [14, 16],
                    [16, 21],
                ], // dup
                [
                    [14, 19],
                    [19, 21],
                ], // 14/21
                [
                    [14, 19],
                    [23, 25],
                ],
            ],
            expectedRedundancy: [true, false, false],

            // you can bear off 23 after 14/19
        },
    },
    {
        name: "You don't have to use all dices at the end of game",
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, /* bar */ 0, 1, 0, 0, 0, 0, 0,
            ],
            diceRoll: [2, 5],
            expectedMoves: [
                [[20, 25]],
                [
                    [20, 22],
                    [22, 27],
                ],
            ],
            expectedRedundancy: [false, false],
        },
    },
    {
        name: 'There is no piece',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [[]],
            expectedRedundancy: [false],
        },
    },
]

describe('Basic Backgammon rules', () => {
    testWith(basicTestItems)
})

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["basicTest"] }] */
function testWith(testConds: { name: string; args: BasicTestArg }[]) {
    testConds.forEach(
        ({ name, args }: { name: string; args: BasicTestArg }) => {
            // eslint-disable-next-line  jest/valid-title
            test(name, () => {
                basicTest(args)
            })
        }
    )
}

function basicTest(arg: BasicTestArg) {
    const node = boardStateNodeFromArray(
        arg.pos,
        arg.diceRoll[0],
        arg.diceRoll[1]
    )

    const collected = collectMoves(node).sort((a, b) =>
        sortMoves(a.moves, b.moves)
    )

    expect(collected.map((move) => move.moves)).toEqual(
        arg.expectedMoves.map((moves: Moves) =>
            moves.map(([from, to, isHit]: [number, number, boolean?]) =>
                move(from, to, isHit)
            )
        )
    )

    const isCommitable =
        arg.expectedMoves.length === 1 && arg.expectedMoves[0].length === 0
    expect(node.isCommitable).toBe(isCommitable)
    expect(collected.map((moves) => moves.isRedundant)).toEqual(
        arg.expectedRedundancy
    )
}

import { DicePip } from '../Dices'
import { listupMovesTest } from './BoardStateNode.listup.common'

type Moves = [number, number, boolean?][]
type ListupMovesTestArg = {
    pos: number[]
    diceRoll: [DicePip, DicePip]
    expectedMoves: Moves[]
    expectedRedundancy?: boolean[]
}

const listupMovesTestItems: { name: string; args: ListupMovesTestArg }[] = [
    {
        name: 'listup moves, with no special treatment for doublet',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [13, 14],
                    [14, 16],
                ], // dup 13/16
                [
                    [13, 14],
                    [15, 17],
                ], // dup 13/14 15/17
                [
                    [13, 15],
                    [15, 16],
                ], //     13/16
                [
                    [15, 16],
                    [13, 15],
                ], // dup 13/16
                [
                    [15, 16],
                    [16, 18],
                ], // dup 15/18
                [
                    [15, 17],
                    [13, 14],
                ], //     13/14 15/17
                [
                    [15, 17],
                    [17, 18],
                ], //     15/18
            ],
            expectedRedundancy: [true, true, false, true, true, false, false],
        },
    },
    {
        name: 'listup moves (rec 1)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 1],
            expectedMoves: [
                [
                    [13, 14],
                    [14, 15],
                ],
            ],
            expectedRedundancy: [false],
        },
    },
    {
        name: 'listup moves (rec 2)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 1],
            expectedMoves: [
                [
                    [13, 14],
                    [14, 15],
                ],
                [
                    [13, 14],
                    [15, 16],
                ],
                [
                    [15, 16],
                    [13, 14],
                ], // dup 13/14 15/16
                [
                    [15, 16],
                    [16, 17],
                ],
            ],
            expectedRedundancy: [false, false, true, false],
        },
    },
]

describe('listup moves', () => {
    testWith(listupMovesTestItems)
})

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["listupMovesTest"] }] */
function testWith(testConds: { name: string; args: ListupMovesTestArg }[]) {
    testConds.forEach(
        ({ name, args }: { name: string; args: ListupMovesTestArg }) => {
            // eslint-disable-next-line  jest/valid-title
            test(name, () => {
                listupMovesTest(args, { movesForDoublet: 2 })
            })
        }
    )
}

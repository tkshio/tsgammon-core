import { boardStateNodeFromArray } from '../BoardStateNode'
import { collectMoves } from '../utils/collectMoves'
import { DicePip } from '../Dices'
import { Move } from '../Move'

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

const listupMovesTestItems: { name: string; args: BasicTestArg }[] = [
    {
        name: 'listup moves',
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
                    [15, 16],
                    [16, 17],
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
                // 13-14: 14, 15
                // 13-14: 14-15: 15x2
                [
                    [13, 14],
                    [14, 15],
                    [15, 16],
                    [15, 16],
                ], //     13/15 15/16(2)
                [
                    [13, 14],
                    [14, 15],
                    [15, 16],
                    [16, 17],
                ], //     13/17
                // 13-14: 15-16: 14, 16
                [
                    [13, 14],
                    [15, 16],
                    [14, 15],
                    [15, 16],
                ], // dup 13/15 15/16(2)
                [
                    [13, 14],
                    [15, 16],
                    [14, 15],
                    [16, 17],
                ], // dup 13/17
                [
                    [13, 14],
                    [15, 16],
                    [16, 17],
                    [14, 15],
                ], // dup 13/17
                [
                    [13, 14],
                    [15, 16],
                    [16, 17],
                    [17, 18],
                ], //     13/14 15/18
                // 15-16: 13, 16
                // 15-16: 13-14: 14, 16
                [
                    [15, 16],
                    [13, 14],
                    [14, 15],
                    [15, 16],
                ], // dup 13/15 15/16(2)
                [
                    [15, 16],
                    [13, 14],
                    [14, 15],
                    [16, 17],
                ], // dup 13/17
                [
                    [15, 16],
                    [13, 14],
                    [16, 17],
                    [14, 15],
                ], // dup 13/17
                [
                    [15, 16],
                    [13, 14],
                    [16, 17],
                    [17, 18],
                ], // dup 13/14 15/18
                // 15-16: 16-17: 13, 17
                [
                    [15, 16],
                    [16, 17],
                    [13, 14],
                    [14, 15],
                ], // dup 13/17
                [
                    [15, 16],
                    [16, 17],
                    [13, 14],
                    [17, 18],
                ], // dup 13/14 15/18
                [
                    [15, 16],
                    [16, 17],
                    [17, 18],
                    [13, 14],
                ], // dup 13/14 15/18
                [
                    [15, 16],
                    [16, 17],
                    [17, 18],
                    [18, 19],
                ], //     15/19
            ],
            expectedRedundancy: [
                false,
                false,
                true,
                true,
                true,
                false,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                false,
            ],
        },
    },
    {
        name: 'listup moves for empty board',
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
    {
        name: 'listup moves for empty board(rec)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, 0,
            ],
            diceRoll: [1, 1],
            expectedMoves: [[]],
            expectedRedundancy: [false],
        },
    },
]

const implementationDependentMattersTest: {
    name: string
    args: BasicTestArg
}[] = [
    {
        name: 'Bar point should not block opponent',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 1, -2,
            ],
            diceRoll: [1, 1],
            expectedMoves: [[[24, 25]]],
            // ベアリングオフの行き先であるpos[24]は、実装上は相手側のバーポイントなので、
            // それがベアリングのムーブに対するブロックになってしまわないことの確認
            expectedRedundancy: [false],
        },
    },
]

const markRedundantMovesTest: { name: string; args: BasicTestArg }[] = [
    {
        name: 'mark redundant when the same piece moved twice and no hits in midst',
        args: {
            pos: [
                0, 1, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, -2,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [1, 2],
                    [2, 4],
                ], // dup 1/4
                [
                    [1, 2],
                    [13, 15],
                ], // dup 1/2 13/15
                [
                    [1, 3],
                    [3, 4],
                ], //     1/4
                [
                    [1, 3],
                    [13, 14],
                ], //     1/3 13/14

                [
                    [13, 14],
                    [1, 3],
                ], // dup 1/3 13/14
                [
                    [13, 14],
                    [14, 16, true],
                ], // dup 13/16*
                [
                    [13, 15],
                    [1, 2],
                ], //     1/2 13/15
                [
                    [13, 15],
                    [15, 16, true],
                ], //     13/16*
            ],
            expectedRedundancy: [
                true,
                true,
                false,
                false,
                true,
                true,
                false,
                false,
            ],
        },
    },
    {
        name: 'do not mark redundant when the same piece moved twice and hits twice',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 1, -1, -1, -1,
                0, 0, /* bar */ 0, 0, 0, 0, 0, 0, -2,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [13, 14, true],
                    [14, 16, true],
                ], //     13/14*/16*
                [
                    [13, 15, true],
                    [15, 16, true],
                ], //     13/15*/16*
            ],
            expectedRedundancy: [false, false],
        },
    },
    {
        name: 'do not mark redundant when the piece hits in first move',
        args: {
            pos: [
                0, 1, -1, 0, -1, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 1, 0, -1, 0,
                0, 0, /* bar */ 0, 0, 0, 0, 0, 0, -2,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [1, 2, true],
                    [2, 4, true],
                ],
                [
                    [1, 2, true],
                    [13, 15, true],
                ], // dup 1/2* 13/15*
                [
                    [1, 3],
                    [3, 4, true],
                ],
                [
                    [1, 3],
                    [13, 14],
                ], //     1/3 13/14

                [
                    [13, 14],
                    [1, 3],
                ], // dup 1/3 13/14
                [
                    [13, 14],
                    [14, 16],
                ],
                [
                    [13, 15, true],
                    [1, 2, true],
                ], //     1/2* 13/15*
                [
                    [13, 15, true],
                    [15, 16],
                ],
            ],
            expectedRedundancy: [
                false,
                true,
                false,
                false,
                true,
                false,
                false,
                false,
            ],
        },
    },
    {
        name: 'mark redundant when moves are from the same point',
        args: {
            pos: [
                0, 3, 0, -1, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, -2,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [1, 2],
                    [1, 3, true],
                ], // dup 1/2 1/3*
                [
                    [1, 2],
                    [2, 4],
                ],
                [
                    [1, 3, true],
                    [1, 2],
                ], //     1/2 1/3
                [
                    [1, 3, true],
                    [3, 4],
                ],
            ],
            expectedRedundancy: [true, false, false, false],
        },
    },
    {
        name: 'do not mark redundant in bearing-off case, with overrun',
        args: {
            pos: [
                0, 0, 0, -1, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, /* bar */ 0, 0, 0, 1, 1, 0, -2,
            ],
            diceRoll: [3, 2],
            expectedMoves: [
                // overrunの場合は、23/offを先にPlayできないのでdupにならない
                [
                    [22, 24],
                    [23, 26],
                ], //     22/24, 23/off
                [
                    [22, 25],
                    [23, 25],
                ], //     22/off, 23/off
                [
                    [23, 25],
                    [22, 25],
                ], // dup 22/off, 23/off
            ],
            expectedRedundancy: [false, false, true],
        },
    },
    {
        name: 'mark redundant in bearing-off case, without overrun',
        args: {
            pos: [
                0, 0, 0, -1, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, /* bar */ 0, 0, 1, 1, 0, 0, -2,
            ],
            diceRoll: [3, 2],
            expectedMoves: [
                // ちょうどで上げる場合は、どちらが先でもいいので片方はdupになる
                [
                    [21, 23],
                    [22, 25],
                ], // dup 21/23, 22/off
                [
                    [21, 24],
                    [22, 24],
                ], //     21/24, 21/24
                [
                    [22, 24],
                    [21, 24],
                ], // dup 22/24, 22/24
                [
                    [22, 25],
                    [21, 23],
                ], //     21/23, 22/off
            ],
            expectedRedundancy: [true, false, true, false],
        },
    },
    {
        name: 'move after reenter is not redundant',
        args: {
            pos: [
                1, 0, 0, 0, -2, -2, -2, /* bar */ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, /* bar */ 0, 0, 0, 0, 0, 0, -2,
            ],
            diceRoll: [5, 2],
            expectedMoves: [
                [
                    [0, 2],
                    [2, 7],
                ],
                [
                    [0, 2],
                    [7, 12],
                ],
            ],
            expectedRedundancy: [false, false],
        },
    },
    {
        name: 'move after reenter is not redundant 2',
        args: {
            pos: [
                1, 0, 0, 0, -2, -2, -2, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, /* bar */ 0, 0, 0, 0, 0, 0, -2,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [0, 1],
                    [1, 3],
                ], // dup
                [
                    [0, 2],
                    [2, 3],
                ], //
            ],
            expectedRedundancy: [true, false],
        },
    },
    {
        name: 'mark redundant for doublet',
        args: {
            pos: [
                0, 1, 0, 1, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, /* bar */ 0, 0, 0, 0, 0, 0, -2,
            ],
            diceRoll: [2, 2],
            expectedMoves: [
                [
                    [1, 3],
                    [3, 5],
                    [3, 5],
                    [5, 7],
                ], //     A 1/3 3/5(2) 5/7
                [
                    [1, 3],
                    [3, 5],
                    [5, 7],
                    [3, 5],
                ], // dup A
                [
                    [1, 3],
                    [3, 5],
                    [5, 7],
                    [7, 9],
                ], //     B 1/3/5/7/9
                [
                    [3, 5],
                    [1, 3],
                    [3, 5],
                    [5, 7],
                ], // dup A
                [
                    [3, 5],
                    [1, 3],
                    [5, 7],
                    [3, 5],
                ], // dup A

                [
                    [3, 5],
                    [1, 3],
                    [5, 7],
                    [7, 9],
                ], // dup B
                [
                    [3, 5],
                    [5, 7],
                    [1, 3],
                    [3, 5],
                ], // dup A
                [
                    [3, 5],
                    [5, 7],
                    [1, 3],
                    [7, 9],
                ], // dup B
                [
                    [3, 5],
                    [5, 7],
                    [7, 9],
                    [1, 3],
                ], // dup B
                [
                    [3, 5],
                    [5, 7],
                    [7, 9],
                    [9, 11],
                ], //       3/5/7/9/11
            ],
            expectedRedundancy: [
                false,
                true,
                false,
                true,
                true,
                true,
                true,
                true,
                true,
                false,
            ],
        },
    },
    {
        name: 'do not mark redundant (crossover and bear-off)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, -7, /* bar */ 0, -3, 0, 0, 0, 0, -1, 0, 0, 0,
                0, 1, /* bar */ 4, 2, 3, 3, 2, 0, -1,
            ],
            diceRoll: [6, 5],
            expectedMoves: [
                [
                    [18, 23],
                    [19, 25],
                ],
                [
                    [18, 24],
                    [19, 24],
                ], //     19/24 18/24
                [
                    [18, 24],
                    [20, 25],
                ],
                [
                    [19, 24],
                    [18, 24],
                ], // dup 19/24 18/24
            ],
            expectedRedundancy: [false, false, false, true],
        },
    },
    {
        name: 'do not mark redundant (crossover and bear-off, minor-pip-first forced)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, -7, /* bar */ 0, -3, 0, 0, 0, 0, -1, 0, 0, 0,
                0, 1, /* bar */ 4, 2, 3, 3, 2, -3, -1,
            ],
            diceRoll: [6, 5],
            expectedMoves: [
                [
                    [18, 23],
                    [19, 25],
                ],
            ],
            expectedRedundancy: [false],
        },
    },
    {
        name: 'do not mark redundant (crossover and bear-off-overrun)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, -7, /* bar */ 0, -3, 0, 0, 0, 0, -1, 0, 0, 0,
                0, 1, /* bar */ 0, 0, 0, 0, 2, 0, -1,
            ],
            diceRoll: [6, 3],
            expectedMoves: [
                [
                    [18, 21],
                    [21, 27],
                ],
                [
                    [18, 24],
                    [23, 26],
                ],
            ],
            expectedRedundancy: [false, false],
        },
    },
    {
        name: 'do not mark redundant (crossover and bear-off-overrun, minor-pip-first forced)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, -7, /* bar */ 0, -3, 0, 0, 0, 0, -1, 0, 0, 0,
                0, 1, /* bar */ 0, 0, 0, 0, 2, -3, -1,
            ],
            diceRoll: [6, 3],
            expectedMoves: [
                [
                    [18, 21],
                    [21, 27],
                ],
            ],
            expectedRedundancy: [false],
        },
    },
    {
        name: 'do not mark redundant (overrun)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, -7, /* bar */ 0, -3, 0, 0, 0, 0, -1, 0, 0, 0,
                0, 0, /* bar */ 1, 0, 0, 0, 2, 1, -1,
            ],
            diceRoll: [6, 3],
            expectedMoves: [
                [
                    [19, 22],
                    [22, 28],
                ],
                [
                    [19, 25],
                    [23, 26],
                ],
            ],
            expectedRedundancy: [false, false],
        },
    },
    {
        name: 'do not mark redundant (overrun of last piece)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, -7, /* bar */ 0, -3, 0, 0, 0, 0, -1, 0, 0, 0,
                0, 0, /* bar */ 1, 0, 0, 0, 0, 0, -1,
            ],
            diceRoll: [4, 3],
            expectedMoves: [
                [
                    [19, 22],
                    [22, 26],
                ], // dup
                [
                    [19, 23],
                    [23, 26],
                ],
            ],
            expectedRedundancy: [true, false],
        },
    },
    {
        name: 'do not mark redundant (crossover and overrun)',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, -7, /* bar */ 0, -3, 0, 0, 0, 0, -1, 0, 0, 0,
                0, 1, /* bar */ 0, 0, 0, 0, 2, 1, -1,
            ],
            diceRoll: [6, 3],
            expectedMoves: [
                [
                    [18, 21],
                    [21, 27],
                ],
                [
                    [18, 24],
                    [23, 26],
                ],
            ],
            expectedRedundancy: [false, false],
        },
    },
    {
        name: 'mark redundant for a redundant play as a result',
        args: {
            pos: [
                0, 0, 0, 0, 0, 0, -7, /* bar */ 0, -3, 0, 0, 0, 0, -1, 0, 0, 0,
                0, 0, /* bar */ 0, 0, 0, 1, 1, 0, -1,
            ],
            diceRoll: [1, 2],
            expectedMoves: [
                [
                    [22, 23],
                    [23, 25],
                ], // dup 22/23/off
                [
                    [22, 24],
                    [23, 24],
                ], //     22/24 23/24
                [
                    [22, 24],
                    [24, 25],
                ], //     22/24/off = 22/23/off
                [
                    [23, 24],
                    [22, 24],
                ], // dup 22/24 23/24
                [
                    [23, 25],
                    [22, 23],
                ], // dup 22/23/off
            ],
            expectedRedundancy: [true, false, false, true, true],
        },
    },
]

describe('Basic Backgammon rules', () => testWith(basicTestItems))
describe('listup moves', () => testWith(listupMovesTestItems))
describe('implementation dependent matters', () =>
    testWith(implementationDependentMattersTest))
describe('mark redundant moves', () => testWith(markRedundantMovesTest))

function testWith(testConds: { name: string; args: BasicTestArg }[]) {
    testConds.forEach(
        ({ name, args }: { name: string; args: BasicTestArg }) => {
            // eslint-disable-next-line jest/valid-title
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

export function move(from: number, to: number, isHit?: boolean): Move {
    return {
        from: from,
        to: to,
        pip: to - from,
        isHit: !!isHit,
        isBearOff: to >= 25,
        isOverrun: to > 25,
    }
}

function sortMove(m1: Move, m2: Move): number {
    const from = m1.from - m2.from
    if (from !== 0) {
        return from
    }
    const to = m1.to - m2.to
    if (to !== 0) {
        return to
    }
    const pip = m1.pip - m2.pip
    if (pip !== 0) {
        return pip
    }
    if (m1.isHit && !m2.isHit) {
        return 1
    }
    if (!m1.isHit && m2.isHit) {
        return -1
    }
    if (m1.isBearOff && !m2.isBearOff) {
        return 1
    }
    if (!m1.isBearOff && m2.isBearOff) {
        return -1
    }
    if (m1.isOverrun && !m2.isOverrun) {
        return 1
    }
    if (!m1.isOverrun && m2.isOverrun) {
        return -1
    }
    return 0
}
function sortMoves(m1: Move[], m2: Move[]): number {
    if (m1.length !== m2.length) {
        return m1.length - m2.length
    }
    for (let index = 0; index < m1.length; index++) {
        const s = sortMove(m1[index], m2[index])
        if (s !== 0) {
            return s
        }
    }
    return 0
}

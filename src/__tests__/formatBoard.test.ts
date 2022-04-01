import { boardState } from '../BoardState'
import { formatBoard } from '../utils/formatBoard'

const formatBoardTestData = [
    {
        title: 'prints an ordinary position',
        board: {
            // prettier-ignore
            pos: [
                    0,
                    1, 0, 0, 0, 0, -5, 1, -3, 0, 0, 0, 4,
                    -5, 1, 0, 0, 3, 0, 5, 0, 0, 0, 0, -2, 
                    0,
                ],
        },
        output: `
 +12-11-10--9--8--7-------6--5--4--3--2--1-+   
 | X           O  X |   | O              X |   
 | X           O    |   | O                |   
 | X           O    |   | O                |   
 | X                |   | O                |   
 |                  |   | O                |   
^|                  |BAR|                  |   
 | O                |   | X                |   
 | O                |   | X                |   
 | O           X    |   | X                |   
 | O           X    |   | X              O |   
 | O  X        X    |   | X              O |   
 +13-14-15-16-17-18------19-20-21-22-23-24-+   
`,
    },
    {
        title: 'prints pieces on the bar',
        board: {
            // prettier-ignore
            pos: [
                2,
                1, 0, 0, 0, 0, -5, 1, -3, 0, 0, 0, 4,
                -4, 1, 0, 0, 1, 0, 5, 0, 0, 0, 0, -2, 
                -1,
            ],
        },
        output: `
 +12-11-10--9--8--7-------6--5--4--3--2--1-+   
 | X           O  X | O | O              X |   
 | X           O    |   | O                |   
 | X           O    |   | O                |   
 | X                |   | O                |   
 |                  |   | O                |   
^|                  |BAR|                  |   
 |                  |   | X                |   
 | O                |   | X                |   
 | O                |   | X                |   
 | O                | X | X              O |   
 | O  X        X    | X | X              O |   
 +13-14-15-16-17-18------19-20-21-22-23-24-+   
`,
    },
    {
        title: 'prints points with pieces n > 5 in Hex, upper case',
        board: {
            // prettier-ignore
            pos: [
                    7,
                    -14, -13, -12,  -8,  -7,  -6, 11, 10, 9, 8,  7,  6,
                     -7,  -8,  -9, -10, -11, -12,  6,  7, 8, 9, 10, 11, 
                    -15,
                ],
        },
        output: `
 +12-11-10--9--8--7-------6--5--4--3--2--1-+   
 | X  X  X  X  X  X | O | O  O  O  O  O  O |   
 | X  X  X  X  X  X | O | O  O  O  O  O  O |   
 | X  X  X  X  X  X | O | O  O  O  O  O  O |   
 | X  X  X  X  X  X | O | O  O  O  O  O  O |   
 | 6  7  8  9  A  B | F | 6  7  8  C  D  E |   
^|                  |BAR|                  |   
 | 7  8  9  A  B  C | 7 | 6  7  8  9  A  B |   
 | O  O  O  O  O  O | X | X  X  X  X  X  X |   
 | O  O  O  O  O  O | X | X  X  X  X  X  X |   
 | O  O  O  O  O  O | X | X  X  X  X  X  X |   
 | O  O  O  O  O  O | X | X  X  X  X  X  X |   
 +13-14-15-16-17-18------19-20-21-22-23-24-+   
`,
    },
    {
        title: 'prints pieces borne off right side',
        board: {
            // prettier-ignore
            pos: [
                0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0
            ],
            myBornOff: 1,
            oppBornOff: 6,
        },
        output: `
 +12-11-10--9--8--7-------6--5--4--3--2--1-+   
 |                  |   |                  |OO 
 |                  |   |                  |O  
 |                  |   |                  |O  
 |                  |   |                  |O  
 |                  |   |                  |O  
^|                  |BAR|                  |   
 |                  |   |                  |   
 |                  |   |                  |   
 |                  |   |                  |   
 |                  |   |                  |   
 |                  |   |                  |X  
 +13-14-15-16-17-18------19-20-21-22-23-24-+   
`,
    },
    {
        title: 'prints pieces borne off right side (over 10)',
        board: {
            // prettier-ignore
            pos: [
                0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0
            ],
            myBornOff: 14,
            oppBornOff: 12,
        },
        output: `
 +12-11-10--9--8--7-------6--5--4--3--2--1-+   
 |                  |   |                  |OOO
 |                  |   |                  |OOO
 |                  |   |                  |OO 
 |                  |   |                  |OO 
 |                  |   |                  |OO 
^|                  |BAR|                  |   
 |                  |   |                  |XX 
 |                  |   |                  |XXX
 |                  |   |                  |XXX
 |                  |   |                  |XXX
 |                  |   |                  |XXX
 +13-14-15-16-17-18------19-20-21-22-23-24-+   
`,
    },
    {
        title: 'prints pieces borne off right side (full)',
        board: {
            // prettier-ignore
            pos: [
                0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0
            ],
            myBornOff: 15,
            oppBornOff: 20, // don't care for over flow
        },
        output: `
 +12-11-10--9--8--7-------6--5--4--3--2--1-+   
 |                  |   |                  |OOO
 |                  |   |                  |OOO
 |                  |   |                  |OOO
 |                  |   |                  |OOO
 |                  |   |                  |OOO
^|                  |BAR|                  |   
 |                  |   |                  |XXX
 |                  |   |                  |XXX
 |                  |   |                  |XXX
 |                  |   |                  |XXX
 |                  |   |                  |XXX
 +13-14-15-16-17-18------19-20-21-22-23-24-+   
`,
    },
]
describe('formatBoard()', () => {
    /* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["testFormatBoard"] }] */
    test.each(formatBoardTestData)('$title', (data) => {
        testFormatBoard(data)
    })
})

function testFormatBoard(data: {
    board: { pos: number[]; myBornOff?: number; oppBornOff?: number }
    output: string
}) {
    const { myBornOff = 0, oppBornOff = 0 } = data.board
    const board = boardState(data.board.pos, [myBornOff, oppBornOff])
    const output = formatBoard(board)
    const expected = data.output.split('\n').slice(1, -1)
    expect(output).toStrictEqual(expected)
}

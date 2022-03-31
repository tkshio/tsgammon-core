import { BoardState } from '../BoardState'

export function formatBoard(
    board: BoardState,
    red = 'red',
    white = 'white'
): string[] {
    const points = 0
    const cube = 1
    const isRed = true
    const upperIndexRow = '+12-11-10--9--8--7-------6--5--4--3--2--1-+'
    const lowerIndexRow = '+13-14-15-16-17-18------19-20-21-22-23-24-+'
    const isRedOnRoll = isRed ? 'On roll' : ''
    const isWhiteOnRoll = isRed ? '' : 'On roll'
    const cubeRow = '^|                  |BAR|                  |'
    return [
        ` ${upperIndexRow}     O: ${red}`,
        ` ${upperRow(0)}     ${points} points`,
        ` ${upperRow(1)}     ${isRedOnRoll}`,
        ` ${upperRow(2)}     `,
        ` ${upperRow(3)}     `,
        ` ${upperRow(4)}     `,
        `${cubeRow}     (Cube: ${cube})`,
        ` ${lowerRow(4)}     `,
        ` ${lowerRow(3)}     `,
        ` ${lowerRow(2)}     `,
        ` ${lowerRow(1)}     ${isWhiteOnRoll}`,
        ` ${lowerRow(0)}     ${points} points`,
        ` ${lowerIndexRow}     X: ${white}`,
    ]

    function upperRow(n: number) {
        const index = [...Array(12)].map((_, i, arr) => arr.length - i)
        console.log('Upper', index)
        return row(index, n)
    }
    function lowerRow(n: number) {
        const index = [...Array(12)].map((_, i) => i + 13)
        console.log('Lower', index)
        return row(index, n)
    }

    function row(index: number[], n: number) {
        const redPiece = ' X '
        const whitePiece = ' O '
        const blank = '   '

        const left = index.slice(0, 6)
        const right = index.slice(6, 12)
        const print0 = (pos: number) => {
            const c = board.piecesAt(pos)
            return c > 10 || c < -10
                ? `${c} `
                : c > 5 || c < -5
                ? ` ${c} `
                : c > 0
                ? redPiece
                : c < 0
                ? whitePiece
                : blank
        }
        const print =
            n === 0
                ? print0
                : (pos: number) =>
                      board.piecesAt(pos) > n
                          ? redPiece
                          : board.piecesAt(pos) < -n
                          ? whitePiece
                          : blank
        return `|${left.map(print).join('')}|   |${right.map(print).join('')}|`
    }
}

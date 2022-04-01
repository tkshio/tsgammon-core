import { BoardState } from '../BoardState'

/**
 * format boardState to text in GNU Backgammon like style.
 *
 * @param board boardState to format
 * @returns lines of formatted text
 */
export function formatBoard(board: BoardState): string[] {
    const upperIndexRow = ' +12-11-10--9--8--7-------6--5--4--3--2--1-+   '
    const lowerIndexRow = ' +13-14-15-16-17-18------19-20-21-22-23-24-+   '
    const cubeRow = '^|                  |BAR|                  |   '
    return [
        upperIndexRow,
        upperRow(0),
        upperRow(1),
        upperRow(2),
        upperRow(3),
        upperRow(4, true),
        cubeRow,
        lowerRow(4, true),
        lowerRow(3),
        lowerRow(2),
        lowerRow(1),
        lowerRow(0),
        lowerIndexRow,
    ]

    function upperRow(n: number, mayOverflow = false) {
        const pieces = [...Array(12)]
            .map((_, i, arr) => arr.length - i)
            .map((pos) => board.piecesAt(pos))
        const onTheBar = board.piecesAt(25)
        const bornOff = -board.opponentBornOff()
        return row(pieces, n, onTheBar, bornOff, mayOverflow)
    }
    function lowerRow(n: number, mayOverflow = false) {
        const pieces = [...Array(12)]
            .map((_, i) => i + 13)
            .map((pos) => board.piecesAt(pos))
        const onTheBar = board.piecesAt(0)
        const bornOff = board.myBornOff()
        return row(pieces, n, onTheBar, bornOff, mayOverflow)
    }

    function row(
        pieces: number[],
        rowNum: number,
        onTheBar: number,
        bornOff: number,
        mayOverflow: boolean
    ) {
        const myPiece = 'X'
        const oppPiece = 'O'
        const blank = ' '

        const printPiece = (pieces: number) =>
            pieces > rowNum ? myPiece : pieces < -rowNum ? oppPiece : blank

        const printOverflow = (pieces: number) =>
            pieces >= 6 || pieces <= -6
                ? `${Math.abs(pieces).toString(16).toUpperCase()}`
                : pieces > rowNum
                ? myPiece
                : pieces < -rowNum
                ? oppPiece
                : blank

        const print = mayOverflow ? printOverflow : printPiece

        const left = pieces.slice(0, 6).map(print).join('  ')
        const right = pieces.slice(6, 12).map(print).join('  ')

        const piecesOnTheBoard = ` | ${left} | ${print(onTheBar)} | ${right} |`

        const bornOff0 = printPiece(bornOff)
        const bornOff5 =
            bornOff > 5
                ? printPiece(bornOff - 5)
                : bornOff < -5
                ? printPiece(bornOff + 5)
                : ' '
        const bornOff10 =
            bornOff > 10
                ? printPiece(bornOff - 10)
                : bornOff < -10
                ? printPiece(bornOff + 10)
                : ' '
        const piecesBornOff = `${bornOff0}${bornOff5}${bornOff10}`

        return piecesOnTheBoard + piecesBornOff
    }
}

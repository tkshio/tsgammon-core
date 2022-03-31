import { boardState } from '../BoardState'
import {
    BoardStateNode,
    boardStateNodeFromArray,
    NoMove,
} from '../BoardStateNode'
import { formatBoard } from '../utils/formatBoard'

describe('formatBoard()', () => {
    test('converts boardState into text', () => {
        const node = boardStateNodeFromArray(boardState().points(), 6, 2)
        const nextNode = asNode(asNode(node.majorFirst(1)).majorFirst(12))
        const output = formatBoard(nextNode.board)
        const expected = `
 +12-11-10--9--8--7-------6--5--4--3--2--1-+     O: red
 | X           O  X |   | O              X |     0 points
 | X           O    |   | O                |     On roll
 | X           O    |   | O                |     
 | X                |   | O                |     
 |                  |   | O                |     
^|                  |BAR|                  |     (Cube: 1)
 | O                |   | X                |     
 | O                |   | X                |     
 | O           X    |   | X                |     
 | O           X    |   | X              O |     
 | O  X        X    |   | X              O |     0 points
 +13-14-15-16-17-18------19-20-21-22-23-24-+     X: white
 `
            .split('\n')
            .slice(1, -1)
        expect(output).toStrictEqual(expected)
    })
})

function asNode(node: BoardStateNode | NoMove): BoardStateNode {
    if (node.hasValue) {
        return node
    }
    throw 'Unexpected BoardStateNode'
}

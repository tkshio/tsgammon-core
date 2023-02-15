import { boardState } from '../../BoardState'
import { BoardStateNode } from '../../BoardStateNode'
import { boardStateNodeFromArray } from '../../BoardStateNodeBuilders'
import { standardConf } from '../../GameConfs'
import { toFIBSBoard } from '../../utils/toFIBSBoardString'
import { testData, testDataAfterMove, testDataWithRoll } from './FIBSBoard.data'

describe('encode BoardState', () => {
    test.each(testData)('encodes $title', (data) => {
        const { myBearOff = 0, oppBearOff = 0 } = data
        const board = boardState(data.pos, [myBearOff, oppBearOff])
        const opt = {
            player: data.player,
            opponent: data.opponent,
            colour: data.colour,
            direction: data.direction,
            turn: data.turn,
        }
        expect(
            toFIBSBoard(
                { board, cube: data.cube, matchScore: data.matchScore },
                opt
            )
        ).toStrictEqual(data.fibs)
    })
})

describe('encode BoardStateNode', () => {
    test.each(testDataWithRoll)('encodes $title', (data) => {
        const { myBearOff = 0, oppBearOff = 0 } = data
        const root = boardStateNodeFromArray(
            data.pos,
            data.roll.dice1,
            data.roll.dice2,
            standardConf.transition.ruleSet,
            [myBearOff, oppBearOff]
        )
        const node = { ...root.root, dices: root.dices }
        const opt = {
            player: data.player,
            opponent: data.opponent,
            colour: data.colour,
            direction: data.direction,
            turn: data.turn,
        }
        expect(
            toFIBSBoard(
                { board: node, cube: data.cube, matchScore: data.matchScore },
                opt
            )
        ).toStrictEqual(data.fibs)
    })
})

describe('encode intermediate state', () => {
    test.each(testDataAfterMove)('encodes $title', (data) => {
        const { myBearOff = 0, oppBearOff = 0 } = data
        const initialNode = boardStateNodeFromArray(
            data.pos,
            data.roll.dice1,
            data.roll.dice2,
            standardConf.transition.ruleSet,
            [myBearOff, oppBearOff]
        ).root
        const node = data.moves.reduce(
            (prev: BoardStateNode, move: { from: number }) => {
                const next = prev.childNode(move.from)
                if (!next.hasValue) {
                    throw new Error('Illegal move')
                }
                return next
            },
            initialNode
        )
        const opt = {
            player: data.player,
            opponent: data.opponent,
            colour: data.colour,
            direction: data.direction,
            turn: data.turn,
            omitUnusedDice: true,
        }
        expect(
            toFIBSBoard(
                { board: node, cube: data.cube, matchScore: data.matchScore },
                opt
            )
        ).toStrictEqual(data.fibs)
    })
})

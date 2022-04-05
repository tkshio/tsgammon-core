#!/usr/bin/env node

export {}

import { simpleNNEngine } from '../engines/SimpleNNGammon'
import {
    AbsoluteMove,
    absoluteMovesRed,
    absoluteMovesWhite,
} from '../AbsoluteMove'
import { BoardState, boardState } from '../BoardState'
import { BoardStateNode, boardStateNode } from '../BoardStateNode'
import { Dice, DiceRoll } from '../Dices'
import { standardConf } from '../GameConf'
import { Ply } from '../Ply'
import { score, scoreAsRed, scoreAsWhite } from '../Score'
import { randomDiceSource } from '../utils/DiceSource'
import { formatPly } from '../utils/formatPly'
import { formatStake } from '../utils/formatStake'

const diceSource = randomDiceSource
const engine = simpleNNEngine
const conf = standardConf

function runAutoMatch() {
    const gameScoreBefore = score()
    const initialBoardState = boardState(conf.initialPos)
    let { boardStateNode, lastPly: ply } = doOpeningPlay(initialBoardState)
    console.log(formatPly(ply))

    while (!isEoG(boardStateNode)) {
        const { boardStateNode: nextNode, lastPly } = doPlay(
            boardStateNode,
            !ply.isRed
        )
        boardStateNode = nextNode
        ply = lastPly

        console.log(formatPly(ply))
    }

    const eogStatus = boardStateNode.board.eogStatus()
    const stake = (ply.isRed ? scoreAsRed : scoreAsWhite)(
        eogStatus.calcStake(1, conf.jacobyRule)
    )
    console.log(formatStake(stake, eogStatus))

    const gameScore = gameScoreBefore.add(stake)
    console.log(
        `Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`
    )
}

function doOpeningPlay(boardState: BoardState) {
    const roll = diceSource.openingRoll()
    const isRed = roll.dice1 > roll.dice2

    return doCheckerPlay(boardState, roll, isRed)
}

function doPlay(lastStateNode: BoardStateNode, isRed: boolean) {
    const roll = diceSource.roll()

    return doCheckerPlay(lastStateNode.board.revert(), roll, isRed)
}

function doCheckerPlay(boardState: BoardState, roll: DiceRoll, isRed: boolean) {
    const node = boardStateNode(boardState, roll)

    const nextNode = engine.checkerPlay(node)

    const amoves: AbsoluteMove[] = (
        isRed ? absoluteMovesRed : absoluteMovesWhite
    )(nextNode.lastMoves())

    const lastPly: Ply = {
        moves: amoves,
        dices: nextNode.dices.map((dice: Dice) => dice.pip),
        isRed,
    }

    return { boardStateNode: nextNode, lastPly }
}

function isEoG(boardStateNode: BoardStateNode): boolean {
    return boardStateNode.board.eogStatus().isEndOfGame
}

runAutoMatch()

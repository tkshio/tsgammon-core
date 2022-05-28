#!/usr/bin/env node

import { simpleNNEngine } from '../engines/SimpleNNGammon'
import {
    AbsoluteMove,
    absoluteMovesRed,
    absoluteMovesWhite,
} from '../AbsoluteMove'
import { BoardState, boardState } from '../BoardState'
import { EOGStatus } from '../EOGStatus'
import { BoardStateNode, boardStateNode } from '../BoardStateNode'
import { Dice, DiceRoll } from '../Dices'
import { GameConf, standardConf } from '../GameConf'
import { Ply } from '../Ply'
import { Score, score, scoreAsRed, scoreAsWhite } from '../Score'
import { DiceSource, randomDiceSource } from '../utils/DiceSource'
import { formatStake } from '../utils/formatStake'
import { formatBoard } from '../utils/formatBoard'
import { formatPly } from '../utils/formatPly'
import { toPositionID } from '../utils/toPositionID'
import { MoveFormatDirection } from '../utils/formatAbsMove'
import { plyRecordForCheckerPlay, plyRecordForEoG } from '../records/PlyRecord'
import {
    addPlyRecord,
    matchRecord,
    MatchRecordEoG,
    MatchRecordInPlay,
    setEoGRecord,
} from '../records/MatchRecord'
import { SGResult } from '../records/SGResult'
import { formatMatchRecord } from '../records/utils/formatMatchRecord'
import {
    matchStateEOG,
    MatchStateEOG,
    matchStateForUnlimitedMatch,
} from '../dispatchers/MatchState'

const engine = simpleNNEngine
const conf = { ...standardConf, jacobyRule: false }

type Event = PlayEvent | EOGEvent
type PlayEvent = {
    tag: 'play'
    before: BoardState
    after: BoardState
    ply: Ply
}
type EOGEvent = {
    tag: 'eog'
    stake: Score
    eogStatus: EOGStatus
    sgResult: SGResult
}

function* runAutoMatch(
    gameScoreBefore: Score = score(),
    diceSource: DiceSource = randomDiceSource
): Generator<Event, Score> {
    const initialBoardState = boardState(conf.initialPos)
    const roll = diceSource.openingRoll()
    let { boardStateNode: node, lastPly: ply } = doCheckerPlay(
        initialBoardState,
        roll,
        roll.dice1 > roll.dice2
    )
    yield { tag: 'play', before: initialBoardState, after: node.board, ply }

    while (!isEoG(node)) {
        const roll = diceSource.roll()
        const { boardStateNode: nextNode, lastPly } = doCheckerPlay(
            node.board.revert(),
            roll,
            !ply.isRed
        )
        yield {
            tag: 'play',
            before: node.board,
            after: nextNode.board,
            ply: lastPly,
        }

        node = nextNode
        ply = lastPly
    }
    const eogStatus = node.board.eogStatus()
    const stake = (ply.isRed ? scoreAsRed : scoreAsWhite)(
        eogStatus.calcStake(1)
    )

    const gameScore = gameScoreBefore.add(stake)
    yield {
        tag: 'eog',
        stake,
        eogStatus,
        sgResult: ply.isRed ? SGResult.REDWON : SGResult.WHITEWON,
    }
    return gameScore
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

type Driver = {
    doPlay: (evt: PlayEvent) => void
    doEoG: (evt: EOGEvent) => void
    doResult: (evt: { gameScore: Score }) => void
}

const defaultDriver: Driver = {
    doPlay: (evt) => console.log(formatPly(evt.ply)),
    doEoG: (evt) => console.log(formatStake(evt.stake, evt.eogStatus)),
    doResult: (evt) =>
        console.log(
            `Result: red ${evt.gameScore.redScore} - white ${evt.gameScore.whiteScore}`
        ),
}

function runDriver(driver: Driver = defaultDriver) {
    const evtIt = runAutoMatch()
    let e
    while (!(e = evtIt.next()).done) {
        const ev = e.value
        switch (ev.tag) {
            case 'play':
                driver.doPlay(ev)
                break
            case 'eog':
                driver.doEoG(ev)
        }
    }
    const gameScore = e.value
    driver.doResult({ gameScore })
}

function xgDriver(conf: GameConf): Driver {
    const matchState = matchStateForUnlimitedMatch(score(), conf.jacobyRule)
    const record: {
        match: MatchRecordInPlay<undefined>
        eog?: MatchRecordEoG<undefined>
    } = {
        match: matchRecord(conf, matchState),
    }
    return {
        ...defaultDriver,
        doPlay: (evt) => {
            record.match = addPlyRecord(
                record.match,
                plyRecordForCheckerPlay(evt.ply),
                undefined
            )
        },
        doEoG: (evt) => {
            const matchEoG: MatchStateEOG = matchStateEOG(
                record.match.matchState,
                evt.stake,
                evt.eogStatus
            )
            record.eog = setEoGRecord(
                record.match,
                matchEoG,
                plyRecordForEoG(evt.stake, evt.sgResult, evt.eogStatus)
            )
        },
        doResult: () => {
            formatMatchRecord(record.eog ?? record.match)
                .split('\n')
                .forEach((l) => console.log(l))
        },
    }
}

function boardDriver(): Driver {
    return {
        ...defaultDriver,
        doPlay: (evt: { before: BoardState; after: BoardState; ply: Ply }) => {
            const { after, ply } = evt
            // 移動後の盤面を、X=white 側の視点で出力
            const whiteBoard = ply.isRed ? after.revert() : after

            // 移動後の盤面から、次の手番プレイヤーの視点でPosIDを生成
            const posID = toPositionID(after.revert())

            // Moveも画面での座標に合わせて出力（redは1->24, whiteは24->1)
            const plyStr = formatPly(ply, MoveFormatDirection.ABSOLUTE_INV)

            console.log('')
            console.log((ply.isRed ? 'red: ' : 'white: ') + plyStr)
            console.log('')
            console.log(` tsgammon        Position ID: ${posID}`)
            console.log('')
            formatBoard(whiteBoard).forEach((s) => console.log(s))
        },
    }
}

function main() {
    if (process.argv.length < 3) {
        runDriver()
        return
    }
    const arg = process.argv[2]
    if (arg === '-?' || arg === '--help') {
        console.log('usage:')
        console.log('  -x: output as text log (.mat format) ')
        console.log('  -b: output as visual board')
    } else if (arg.startsWith('-x')) {
        runDriver(xgDriver(standardConf))
    } else if (arg.startsWith('-b')) {
        runDriver(boardDriver())
    } else {
        runDriver()
    }
}

main()

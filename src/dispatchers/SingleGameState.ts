import {
    AbsoluteBoardState,
    redViewAbsoluteBoard,
    whiteViewAbsoluteBoard,
} from '../AbsoluteBoardState'
import {
    AbsoluteMove,
    makeMoveAbsoluteAsRed,
    makeMoveAbsoluteAsWhite,
} from '../AbsoluteMove'
import { BoardState } from '../BoardState'
import { BoardStateNode, boardStateNode } from '../BoardStateNode'
import { Dice, DicePip, DiceRoll } from '../Dices'
import { EOGStatus } from '../EOGStatus'
import { Move } from '../Move'
import { Ply } from '../Ply'
import { SGResult } from '../records/SGResult'
import { score, Score, scoreAsRed, scoreAsWhite } from '../Score'

export type SGState = SGOpening | SGInPlay | SGToRoll | SGEoG
export type SGInPlay = SGInPlayRed | SGInPlayWhite
export type SGToRoll = SGToRollRed | SGToRollWhite
export type SGEoG = SGEoGRedWon | SGEoGWhiteWon | SGEoGNoGame

type _SGState = {
    absBoard: AbsoluteBoardState
    boardState: BoardState
}

export type SGOpening = Omit<_SGState, 'lastPly'> & {
    tag: 'SGOpening'
    dicePip?: DicePip
    doOpening: (openingRoll: DiceRoll) => SGInPlay | SGOpening
}

type _SGInPlay = _SGState & {
    tag: 'SGInPlay'
    dices: Dice[]
    curPly: Ply
    boardStateNode: BoardStateNode
    revertTo: BoardStateNode
    toPly: (boardStateNode: BoardStateNode) => Ply
    toAbsBoard: (boardState: BoardState) => AbsoluteBoardState
    toPos: (absPos: number) => number
}

export type SGInPlayRed = _SGInPlay & {
    isRed: true
    doCheckerPlayCommit: (
        boardStateNode: BoardStateNode,
        revertTo: BoardStateNode
    ) => SGToRollWhite | SGEoGRedWon
    withNode: (boardStateNode: BoardStateNode) => SGInPlayRed
}

export type SGInPlayWhite = _SGInPlay & {
    isRed: false
    doCheckerPlayCommit: (
        boardStateNode: BoardStateNode,
        revertTo: BoardStateNode
    ) => SGToRollRed | SGEoGWhiteWon
    withNode: (boardStateNode: BoardStateNode) => SGInPlayWhite
}

type _SGToRoll = _SGState & {
    tag: 'SGToRoll'
    lastPly: Ply
}

export type SGToRollRed = _SGToRoll & {
    isRed: true
    doRoll: (dices: DiceRoll) => SGInPlayRed
}

export type SGToRollWhite = _SGToRoll & {
    isRed: false
    doRoll: (dices: DiceRoll) => SGInPlayWhite
}

export type _SGEoG = _SGState & {
    tag: 'SGEoG'
    dices: Dice[]
    stake: Score
    eogStatus: EOGStatus
}

export type SGEoGRedWon = _SGEoG & {
    result: SGResult.REDWON
    isRed: true
}

export type SGEoGWhiteWon = _SGEoG & {
    result: SGResult.WHITEWON
    isRed: false
}
export type SGEoGNoGame = _SGEoG & {
    result: SGResult.NOGAME
}

export function openingState(
    boardState: BoardState,
    dicePip: DicePip | undefined,
    movesForDouble = 4
): SGOpening {
    const absBoard = whiteViewAbsoluteBoard(boardState)
    return {
        tag: 'SGOpening',
        dicePip,
        absBoard,
        boardState,
        doOpening: (openingRoll: DiceRoll) => {
            if (openingRoll.dice1 === openingRoll.dice2) {
                return openingState(
                    boardState,
                    openingRoll.dice1,
                    movesForDouble
                )
            } else {
                const isRedPlayerFirst = openingRoll.dice1 > openingRoll.dice2
                const boardToPlay = isRedPlayerFirst
                    ? boardState.revert()
                    : boardState

                const inPlayState = isRedPlayerFirst
                    ? inPlayStateRed
                    : inPlayStateWhite

                return inPlayState(boardToPlay, openingRoll, movesForDouble)
            }
        },
    }
}

export function inPlayStateRed(
    boardState: BoardState,
    dices: DiceRoll,
    movesForDouble = 4
): SGInPlayRed {
    const node = boardStateNode(boardState, dices, movesForDouble)

    return inPlayStateRedFromNode(
        node,
        {
            dices: node.dices.map((dice) => dice.pip),
            moves: [],
            isRed: true,
        },
        node,
        movesForDouble
    )
}

export function inPlayStateRedFromNode(
    boardStateNode: BoardStateNode,
    curPly: Ply,
    revertTo: BoardStateNode,
    movesForDouble: number
): SGInPlayRed {
    const dices = boardStateNode.dices
    const absBoard = redViewAbsoluteBoard(boardStateNode.board)
    const toPly = buildToPly(boardStateNode.dices, makeMoveAbsoluteAsRed, true)

    const doCheckerPlayCommit = buildDoCheckerCommit(
        toPly,
        (boardState: BoardState, lastPly: Ply) =>
            toRollStateWhite(boardState, lastPly, movesForDouble),
        (stakeValue: number, eog: EOGStatus, committed: BoardStateNode) =>
            eogStateRed(
                eog.calcStake(stakeValue),
                eog,
                redViewAbsoluteBoard(committed.board),
                committed.board
            )
    )

    return {
        curPly,
        tag: 'SGInPlay',
        boardStateNode,
        boardState: boardStateNode.board,
        dices,
        absBoard,
        revertTo,
        toPly,
        toPos: (n: number) => boardStateNode.board.invertPos(n),
        toAbsBoard: redViewAbsoluteBoard,

        isRed: true,
        doCheckerPlayCommit,
        withNode: (node: BoardStateNode) => {
            return inPlayStateRedFromNode(
                node,
                toPly(node),
                revertTo,
                movesForDouble
            )
        },
    }
}

export function inPlayStateWhite(
    boardState: BoardState,
    dices: DiceRoll,
    movesForDouble = 4
): SGInPlayWhite {
    const node = boardStateNode(boardState, dices, movesForDouble)
    return inPlayStateWhiteFromNode(
        node,
        {
            dices: node.dices.map((dice) => dice.pip),
            moves: [],
            isRed: false,
        },
        node,
        movesForDouble
    )
}

function inPlayStateWhiteFromNode(
    boardStateNode: BoardStateNode,
    curPly: Ply,
    revertTo: BoardStateNode,
    movesForDouble: number
): SGInPlayWhite {
    const dices = boardStateNode.dices
    const absBoard = whiteViewAbsoluteBoard(boardStateNode.board)
    const toPly = buildToPly(
        boardStateNode.dices,
        makeMoveAbsoluteAsWhite,
        false
    )

    const doCheckerPlayCommit = buildDoCheckerCommit(
        toPly,
        (boardState: BoardState, lastPly: Ply) =>
            toRollStateRed(boardState, lastPly, movesForDouble),
        (stakeValue: number, eog: EOGStatus, committed: BoardStateNode) =>
            eogStateWhite(
                eog.calcStake(stakeValue),
                eog,
                whiteViewAbsoluteBoard(committed.board),
                committed.board
            )
    )

    return {
        curPly,
        tag: 'SGInPlay',
        boardStateNode,
        boardState: boardStateNode.board,
        dices,
        absBoard,
        revertTo,
        toPly,
        toPos: (n: number) => n,
        toAbsBoard: whiteViewAbsoluteBoard,

        isRed: false,
        doCheckerPlayCommit,
        withNode: (node: BoardStateNode) => {
            return inPlayStateWhiteFromNode(
                node,
                toPly(node),
                revertTo,
                movesForDouble
            )
        },
    }
}

function buildDoCheckerCommit<TOROLL extends SGToRoll, EOG extends SGEoG>(
    toPly: (board: BoardStateNode) => Ply,
    toRollState: (boardState: BoardState, lastPly: Ply) => TOROLL,
    toEoGState: (
        stakeValue: number,
        eog: EOGStatus,
        committed: BoardStateNode
    ) => EOG
): (committed: BoardStateNode) => EOG | TOROLL {
    return (committed: BoardStateNode) => {
        const ply = toPly(committed)
        const boardState = committed.board
        const eogStatus = boardState.eogStatus()

        if (eogStatus.isEndOfGame) {
            return toEoGState(1, committed.board.eogStatus(), committed)
        } else {
            // 手番プレイヤーと相対表記の盤面とをそれぞれ入れ替える
            const nextBoardState = boardState.revert()
            return toRollState(nextBoardState, ply)
        }
    }
}

export function toRollStateRed(
    boardState: BoardState,
    lastPly: Ply = { moves: [], dices: [], isRed: true },
    movesForDouble = 4
): SGToRollRed {
    const absBoard = redViewAbsoluteBoard(boardState)
    return {
        tag: 'SGToRoll',
        boardState,
        absBoard,

        isRed: true,
        lastPly,

        doRoll: (dices: DiceRoll): SGInPlayRed => {
            return inPlayStateRed(boardState, dices, movesForDouble)
        },
    }
}

export function toRollStateWhite(
    boardState: BoardState,
    lastPly: Ply = { moves: [], dices: [], isRed: false },
    movesForDouble = 4
): SGToRollWhite {
    const absBoard = whiteViewAbsoluteBoard(boardState)
    return {
        tag: 'SGToRoll',
        boardState,
        absBoard,

        isRed: false,
        lastPly,

        doRoll: (dices: DiceRoll): SGInPlayWhite => {
            return inPlayStateWhite(boardState, dices, movesForDouble)
        },
    }
}

export function eogStateRed(
    stakeValue: number,
    eogStatus: EOGStatus,
    absBoard: AbsoluteBoardState,
    boardState: BoardState
): SGEoGRedWon {
    const stake = scoreAsRed(stakeValue)

    return {
        ...eogState(eogStatus, stake, absBoard, boardState),
        result: SGResult.REDWON,
        isRed: true,
    }
}

export function eogStateWhite(
    stakeValue: number,
    eogStatus: EOGStatus,
    absBoard: AbsoluteBoardState,
    boardState: BoardState
): SGEoGWhiteWon {
    const stake = scoreAsWhite(stakeValue)

    return {
        ...eogState(eogStatus, stake, absBoard, boardState),
        result: SGResult.WHITEWON,
        isRed: false,
    }
}

export function eogStateNogame(
    eogStatus: EOGStatus,
    absBoard: AbsoluteBoardState,
    boardState: BoardState
): SGEoG {
    return {
        ...eogState(eogStatus, score(), absBoard, boardState),
        result: SGResult.NOGAME,
    }
}

function eogState(
    eogStatus: EOGStatus,
    stake: Score,
    absBoard: AbsoluteBoardState,
    boardState: BoardState
): _SGEoG {
    return {
        tag: 'SGEoG',
        absBoard,
        boardState,
        dices: [],
        stake,
        eogStatus,
    }
}

function buildToPly(
    dices: Dice[],
    toAbsMove: (move: Move, invertPos: (pos: number) => number) => AbsoluteMove,
    isRed: boolean
): (boardStateNode: BoardStateNode) => Ply {
    return (boardStateNode: BoardStateNode) => {
        return {
            moves: boardStateNode
                .lastMoves()
                .map((m) => toAbsMove(m, boardStateNode.board.invertPos)),
            dices: dices.map((dice) => dice.pip),
            isRed: isRed,
            isWhite: !isRed,
        }
    }
}

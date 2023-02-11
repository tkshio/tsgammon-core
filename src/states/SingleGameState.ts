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
import { BoardStateNode } from '../BoardStateNode'
import { Dice, DicePip } from '../Dices'
import { EOGStatus } from '../EOGStatus'
import { Move } from '../Move'
import { Ply } from '../Ply'
import { SGResult } from '../records/SGResult'
import { score, Score, scoreAsRed, scoreAsWhite } from '../Score'

/**
 * キューブレスのバックギャモンの局面の状態を定義した型
 */
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
}

type _SGInPlay = _SGState & {
    tag: 'SGInPlay'
    dices: Dice[]
    curPly: Ply
    boardStateNode: BoardStateNode
    revertTo: BoardStateNode
}

export type SGInPlayRed = _SGInPlay & {
    isRed: true
}

export type SGInPlayWhite = _SGInPlay & {
    isRed: false
}

type _SGToRoll = _SGState & {
    tag: 'SGToRoll'
    lastPly: Ply
}

export type SGToRollRed = _SGToRoll & {
    isRed: true
}

export type SGToRollWhite = _SGToRoll & {
    isRed: false
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
    dicePip: DicePip | undefined
): SGOpening {
    const absBoard = whiteViewAbsoluteBoard(boardState)
    return {
        tag: 'SGOpening',
        dicePip,
        absBoard,
        boardState,
    }
}

export function inPlayStateRed(
    boardStateNode: BoardStateNode,
    curPly: Ply = {
        dices: boardStateNode.dices.map((dice) => dice.pip),
        moves: [],
        isRed: true,
    },
    revertTo: BoardStateNode = boardStateNode
): SGInPlayRed {
    const dices = boardStateNode.dices
    const absBoard = redViewAbsoluteBoard(boardStateNode.board)

    return {
        curPly,
        tag: 'SGInPlay',
        boardStateNode,
        boardState: boardStateNode.board,
        dices,
        absBoard,
        revertTo,
        isRed: true,
    }
}

export function inPlayStateWhite(
    boardStateNode: BoardStateNode,
    curPly: Ply = {
        dices: boardStateNode.dices.map((dice) => dice.pip),
        moves: [],
        isRed: true,
    },
    revertTo: BoardStateNode = boardStateNode
): SGInPlayWhite {
    const dices = boardStateNode.dices
    const absBoard = whiteViewAbsoluteBoard(boardStateNode.board)

    return {
        curPly,
        tag: 'SGInPlay',
        boardStateNode,
        boardState: boardStateNode.board,
        dices,
        absBoard,
        revertTo,

        isRed: false,
    }
}

export function inPlayStateWithNode(
    state: SGInPlay,
    node: BoardStateNode
): SGInPlay {
    return state.isRed
        ? inPlayStateWithNodeRed(state, node)
        : inPlayStateWithNodeWhite(state, node)
}
export function inPlayState(node: BoardStateNode, isRed: boolean) {
    return (isRed ? inPlayStateRed : inPlayStateWhite)(node)
}

function inPlayStateWithNodeRed(
    state: SGInPlayRed,
    node: BoardStateNode
): SGInPlayRed {
    return inPlayStateRed(node, toPlyRed(state, node), state.revertTo)
}

function inPlayStateWithNodeWhite(
    state: SGInPlayWhite,
    node: BoardStateNode
): SGInPlayWhite {
    return inPlayStateWhite(node, toPlyWhite(state, node), state.revertTo)
}

export function toPly(
    state: ({ isRed: true } | { isRed: false }) & {
        boardStateNode: BoardStateNode
    },
    node?: BoardStateNode
): Ply {
    return state.isRed ? toPlyRed(state, node) : toPlyWhite(state, node)
}

function toPlyRed(
    state: { isRed: true; boardStateNode: BoardStateNode },
    node: BoardStateNode = state.boardStateNode
) {
    return _toPly(node, makeMoveAbsoluteAsRed, true)
}

function toPlyWhite(
    state: { isRed: false; boardStateNode: BoardStateNode },
    node: BoardStateNode = state.boardStateNode
) {
    return _toPly(node, makeMoveAbsoluteAsWhite, false)
}

function _toPly(
    boardStateNode: BoardStateNode, //
    toAbsMove: (move: Move, invertPos: (pos: number) => number) => AbsoluteMove, //
    isRed: boolean
) {
    return {
        moves: boardStateNode.lastMoves.map((m) =>
            toAbsMove(m, boardStateNode.board.invertPos)
        ),
        dices: boardStateNode.dices.map((dice) => dice.pip),
        isRed: isRed,
        isWhite: !isRed,
    }
}

export function toAbsBoard(
    state: SGInPlay,
    boardState: BoardState
): AbsoluteBoardState {
    return (state.isRed ? redViewAbsoluteBoard : whiteViewAbsoluteBoard)(
        boardState
    )
}

export function toPos(state: SGInPlay, absPos: number) {
    return state.isRed ? state.boardStateNode.board.invertPos(absPos) : absPos
}

export function toEoGState(state: SGInPlay): SGEoG {
    const board = state.boardStateNode.board
    const eogStatus = state.boardStateNode.eogStatus

    return (state.isRed ? eogStateRed : eogStateWhite)(1, eogStatus, board)
}

export function toToRollState(state: SGInPlay): SGToRoll {
    const boardStateNode = state.boardStateNode
    return state.isRed
        ? _doCheckerCommit(boardStateNode, toPlyRed(state), toRollStateWhite)
        : _doCheckerCommit(boardStateNode, toPlyWhite(state), toRollStateRed)
}
export function toToRollStateAgain(state: SGInPlay): SGToRoll {
    const boardStateNode = state.boardStateNode
    return state.isRed
        ? _doCheckerCommit(boardStateNode, toPlyRed(state), toRollStateRed)
        : _doCheckerCommit(boardStateNode, toPlyWhite(state), toRollStateWhite)
}

function _doCheckerCommit(
    committed: BoardStateNode,
    lastPly: Ply,
    toRollState: (boardState: BoardState, lastPly: Ply) => SGToRoll
): SGToRoll {
    // 手番プレイヤーと相対表記の盤面とをそれぞれ入れ替える
    const nextBoardState = committed.board.revert()
    return toRollState(nextBoardState, lastPly)
}
export function toRollStateRed(
    boardState: BoardState,
    lastPly: Ply = { moves: [], dices: [], isRed: true }
): SGToRollRed {
    const absBoard = redViewAbsoluteBoard(boardState)
    return {
        tag: 'SGToRoll',
        boardState,
        absBoard,

        isRed: true,
        lastPly,
    }
}

export function toRollStateWhite(
    boardState: BoardState,
    lastPly: Ply = { moves: [], dices: [], isRed: false }
): SGToRollWhite {
    const absBoard = whiteViewAbsoluteBoard(boardState)
    return {
        tag: 'SGToRoll',
        boardState,
        absBoard,

        isRed: false,
        lastPly,
    }
}

export function eogStateRed(
    stakeValue: number,
    eogStatus: EOGStatus,
    boardState: BoardState
): SGEoGRedWon {
    const stake = scoreAsRed(stakeValue)
    const absBoard = redViewAbsoluteBoard(boardState)

    return {
        ..._eogState(eogStatus, stake, absBoard, boardState),
        result: SGResult.REDWON,
        isRed: true,
    }
}

export function eogStateWhite(
    stakeValue: number,
    eogStatus: EOGStatus,
    boardState: BoardState
): SGEoGWhiteWon {
    const stake = scoreAsWhite(stakeValue)
    const absBoard = whiteViewAbsoluteBoard(boardState)

    return {
        ..._eogState(eogStatus, stake, absBoard, boardState),
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
        ..._eogState(eogStatus, score(), absBoard, boardState),
        result: SGResult.NOGAME,
    }
}

function _eogState(
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

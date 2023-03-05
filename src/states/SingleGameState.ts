import {
    AbsoluteBoardState,
    redViewAbsoluteBoard,
    whiteViewAbsoluteBoard,
} from '../AbsoluteBoardState'
import { BoardState } from '../BoardState'
import { BoardStateNode } from '../BoardStateNode'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'
import { Dice, DiceRoll } from '../Dices'
import { EOGStatus } from '../EOGStatus'
import { Ply } from '../Ply'
import { SGResult } from '../records/SGResult'
import { score, Score, scoreAsRed, scoreAsWhite } from '../Score'
import { toPlyRed, toPlyWhite } from './toPly'

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
    diceRoll?: DiceRoll
}

type _SGInPlay = _SGState & {
    tag: 'SGInPlay'
    curPly: Ply
    rootNode: BoardStateNodeRoot
    boardStateNode: BoardStateNode
    isRootState: boolean
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
    diceRoll?: DiceRoll
): SGOpening {
    const absBoard = whiteViewAbsoluteBoard(boardState)
    return {
        tag: 'SGOpening',
        diceRoll,
        absBoard,
        boardState,
    }
}

export function inPlayState(isRed: boolean, rootNode: BoardStateNodeRoot) {
    return (isRed ? inPlayStateRed : inPlayStateWhite)(rootNode)
}

export function inPlayStateWithNode(
    state: SGInPlay,
    node: BoardStateNode
): SGInPlay {
    return (state.isRed ? _inPlayStateRed : _inPlayStateWhite)(
        state.rootNode,
        node,
        false
    )
}

export function inPlayStateRed(rootNode: BoardStateNodeRoot) {
    return _inPlayStateRed(rootNode, rootNode.primary, true)
}

export function inPlayStateWhite(rootNode: BoardStateNodeRoot) {
    return _inPlayStateWhite(rootNode, rootNode.primary, true)
}

function _inPlayStateRed(
    rootNode: BoardStateNodeRoot,
    curNode: BoardStateNode,
    isRootState: boolean
): SGInPlayRed {
    const curPly = toPlyRed(rootNode.dices, curNode)
    const absBoard = redViewAbsoluteBoard(curNode.board)

    return {
        curPly,
        tag: 'SGInPlay',
        rootNode,
        boardStateNode: curNode,
        boardState: curNode.board,
        absBoard,
        isRed: true,
        isRootState,
    }
}

function _inPlayStateWhite(
    rootNode: BoardStateNodeRoot,
    curNode: BoardStateNode,
    isRootState: boolean
): SGInPlayWhite {
    const curPly = toPlyWhite(rootNode.dices, curNode)
    const absBoard = whiteViewAbsoluteBoard(curNode.board)

    return {
        curPly,
        tag: 'SGInPlay',
        rootNode,
        boardStateNode: curNode,
        boardState: curNode.board,
        absBoard,
        isRed: false,
        isRootState,
    }
}

export function toPly(state: SGInPlay): (node: BoardStateNode) => Ply {
    const func = state.isRed ? toPlyRed : toPlyWhite
    return (node) => func(state.rootNode.dices, node)
}

export function toAbsBoard(
    state: SGInPlay
): (boardState: BoardState) => AbsoluteBoardState {
    const func = state.isRed ? redViewAbsoluteBoard : whiteViewAbsoluteBoard
    return (boardState: BoardState) => func(boardState)
}

export function toPos(state: SGInPlay): (absPos: number) => number {
    return state.isRed
        ? (absPos) => state.boardStateNode.board.invertPos(absPos)
        : (absPos) => absPos
}

export function toEoGState(state: SGInPlay): SGEoG {
    const board = state.boardStateNode.board
    const eogStatus = state.boardStateNode.eogStatus

    return (state.isRed ? eogStateRed : eogStateWhite)(1, eogStatus, board)
}

export function toToRollState(state: SGInPlay): SGToRoll {
    const dices = state.rootNode.dices
    const boardStateNode = state.boardStateNode
    return state.isRed
        ? _doCheckerCommit(
              boardStateNode,
              toPlyRed(dices, boardStateNode),
              toRollStateWhite
          )
        : _doCheckerCommit(
              boardStateNode,
              toPlyWhite(dices, boardStateNode),
              toRollStateRed
          )
}
export function toToRollStateAgain(state: SGInPlay): SGToRoll {
    const dices = state.rootNode.dices
    const boardStateNode = state.boardStateNode
    return state.isRed
        ? _doCheckerCommit(
              boardStateNode,
              toPlyRed(dices, boardStateNode),
              toRollStateRed
          )
        : _doCheckerCommit(
              boardStateNode,
              toPlyWhite(dices, boardStateNode),
              toRollStateWhite
          )
}

function _doCheckerCommit(
    committed: BoardStateNode,
    lastPly: Ply,
    toRollStateFunc: (boardState: BoardState, lastPly: Ply) => SGToRoll
): SGToRoll {
    // 手番プレイヤーと相対表記の盤面とをそれぞれ入れ替える
    const nextBoardState = committed.board.revert()
    return toRollStateFunc(nextBoardState, lastPly)
}

export function toRollState(
    isRed: boolean,
    boardState: BoardState,
    lastPly?: Ply
) {
    return (isRed ? toRollStateRed : toRollStateWhite)(boardState, lastPly)
}

export function toRollStateRed(
    boardState: BoardState,
    lastPly: Ply = { moves: [], dices: [], isRed: false }
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
    lastPly: Ply = { moves: [], dices: [], isRed: true }
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

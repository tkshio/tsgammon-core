import { nodeWithEmptyDice } from '../../BoardStateNode'
import { boardState as _boardState } from '../../BoardState'
import { cube, CubeState } from '../../CubeState'
import { DicePip } from '../../Dices'
import { eog } from '../../EOGStatus'
import { GameConf, standardConf } from '../../GameConf'
import { Ply } from '../../Ply'
import { SGResult } from '../../records/SGResult'
import { Score } from '../../Score'
import {
    cbActionRed,
    cbActionWhite,
    cbInPlayRed,
    cbInPlayWhite,
    cbOpening,
    cbResponseRed,
    cbResponseWhite,
    CBState,
    cbToRollRed,
    cbToRollWhite,
    resultToCBEoG,
} from '../CubeGameState'
import {
    eogStateRed,
    eogStateWhite,
    inPlayStateRed,
    inPlayStateWhite,
    openingState,
    SGState,
    toRollStateRed,
    toRollStateWhite,
} from '../SingleGameState'
import {
    redViewAbsoluteBoard,
    whiteViewAbsoluteBoard,
} from '../../AbsoluteBoardState'

export enum GameStatus {
    OPENING,
    INPLAY_RED,
    INPLAY_WHITE,
    CUBEACTION_RED,
    CUBEACTION_WHITE,
    CUBERESP_RED,
    CUBERESP_WHITE,
    TOROLL_RED,
    TOROLL_WHITE,
    EOG_REDWON,
    EOG_WHITEWON,
}

export type GameSetup =
    | {
          gameStatus?: GameStatus.OPENING
          absPos?: number[]
          cubeState?: CubeState
      }
    | {
          gameStatus:
              | GameStatus.TOROLL_RED
              | GameStatus.TOROLL_WHITE
              | GameStatus.CUBEACTION_RED
              | GameStatus.CUBEACTION_WHITE
              | GameStatus.CUBERESP_RED
              | GameStatus.CUBERESP_WHITE

          absPos: number[]
          cubeState?: CubeState
          lastPly?: Ply
      }
    | {
          gameStatus: GameStatus.EOG_REDWON | GameStatus.EOG_WHITEWON

          absPos: number[]
          stake: Score
          cubeState?: CubeState
          lastPly?: Ply
      }
    | {
          gameStatus: GameStatus.INPLAY_RED | GameStatus.INPLAY_WHITE

          dice1: DicePip
          dice2: DicePip
          absPos: number[]
          cubeState?: CubeState

          lastPly?: Ply
      }

export function toCBState(gameState: GameSetup = {}): CBState {
    const { gameStatus, cubeState = cube(1) } = gameState
    if (gameStatus === undefined) {
        return cbOpening(cubeState)
    }
    switch (gameStatus) {
        case GameStatus.OPENING:
            return cbOpening(cubeState)
        case GameStatus.INPLAY_RED:
            return cbInPlayRed(cubeState)
        case GameStatus.INPLAY_WHITE:
            return cbInPlayWhite(cubeState)
        case GameStatus.CUBEACTION_RED:
            return cbActionRed(cubeState)
        case GameStatus.CUBEACTION_WHITE:
            return cbActionWhite(cubeState)
        case GameStatus.CUBERESP_RED:
            return cbResponseRed(cubeState)
        case GameStatus.CUBERESP_WHITE:
            return cbResponseWhite(cubeState)
        case GameStatus.TOROLL_RED:
            return cbToRollRed(cubeState, 'Skip')
        case GameStatus.TOROLL_WHITE:
            return cbToRollWhite(cubeState, 'Skip')
        case GameStatus.EOG_REDWON:
            return resultToCBEoG(cubeState, SGResult.REDWON, eog())
        case GameStatus.EOG_WHITEWON:
            return resultToCBEoG(cubeState, SGResult.WHITEWON, eog())
    }
}

export function toSGState(
    gameState: GameSetup = {},
    gameConf: GameConf = standardConf
): SGState {
    const { movesForDoublet = 4 } = gameConf
    if (gameState.gameStatus === undefined) {
        return openingState(
            boardState(gameState.absPos ?? standardConf.initialPos),
            undefined,
            movesForDoublet
        )
    }
    switch (gameState.gameStatus) {
        case GameStatus.OPENING:
            return openingState(
                boardState(gameState.absPos ?? standardConf.initialPos),
                undefined,
                movesForDoublet
            )
        case GameStatus.CUBEACTION_RED:
        case GameStatus.TOROLL_RED:
        case GameStatus.CUBERESP_WHITE: {
            const board = boardState(gameState.absPos)
            const lastStateNode = nodeWithEmptyDice(board)
            return toRollStateRed(
                lastStateNode.board.revert(),
                gameState.lastPly,
                movesForDoublet
            )
        }
        case GameStatus.CUBEACTION_WHITE:
        case GameStatus.TOROLL_WHITE:
        case GameStatus.CUBERESP_RED: {
            const lastBoardState = boardState(gameState.absPos).revert()
            const lastStateNode = nodeWithEmptyDice(lastBoardState)
            return toRollStateWhite(
                lastStateNode.board.revert(),
                gameState.lastPly,
                movesForDoublet
            )
        }
        case GameStatus.INPLAY_RED:
            return inPlayStateRed(
                boardState(gameState.absPos).revert(),
                gameState,
                movesForDoublet
            )
        case GameStatus.INPLAY_WHITE:
            return inPlayStateWhite(
                boardState(gameState.absPos),
                gameState,
                movesForDoublet
            )
        case GameStatus.EOG_REDWON: {
            const lastBoardState = boardState(gameState.absPos).revert()
            return eogStateRed(
                1,
                eog(),
                redViewAbsoluteBoard(lastBoardState),
                lastBoardState
            )
        }
        case GameStatus.EOG_WHITEWON: {
            const lastBoardState = boardState(gameState.absPos).revert()
            return eogStateWhite(
                1,
                eog(),
                whiteViewAbsoluteBoard(lastBoardState),
                lastBoardState
            )
        }
    }

    function boardState(pos: number[]) {
        const pieces = pos.reduce(
            (prev: { me: number; opp: number }, cur: number) => {
                return cur > 0
                    ? { me: prev.me + cur, opp: prev.opp }
                    : cur < 0
                    ? { me: prev.me, opp: prev.opp - cur }
                    : prev
            },
            { me: 0, opp: 0 }
        )
        return _boardState(
            pos,
            [15 - pieces.me, 15 - pieces.opp],
            gameConf.innerPos,
            gameConf.isEoGFunc
        )
    }
}

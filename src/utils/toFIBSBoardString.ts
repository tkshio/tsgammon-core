import { boardState, BoardState } from '../BoardState'
import { cube, CubeState } from '../CubeState'
import { DiceRoll } from '../Dices'

import {
    FIBSBoard,
    initBoard,
    TURN,
    encodeFIBSBoardString,
    COLOUR,
    DIRECTION,
} from './FIBSBoardString'

export function toFIBSBoard(
    arg: number[] | BoardState,
    opt: { colour?: COLOUR; direction?: DIRECTION } = {}
): string {
    const board = Array.isArray(arg) ? boardState(arg) : arg
    return encodeFIBSBoardString(
        boardStateToFIBSBoard(board, opt, undefined, undefined)
    )
}

function boardStateToFIBSBoard(
    boardState: BoardState,
    opt: { colour?: COLOUR; direction?: DIRECTION; turn?: TURN },
    diceRoll: DiceRoll | { dice1: 0; dice2: 0 } = { dice1: 0, dice2: 0 },
    cubeState: CubeState = cube(1)
): FIBSBoard {
    const { colour = COLOUR.X, direction = DIRECTION.DESC } = opt
    const posArr =
        colour === COLOUR.O
            ? boardState.points()
            : boardState.points().map((p) => -p)

    // 手番はデフォルトでは自分（COLOURで決まる）で、指定があればそれを優先
    const { turn = colour === COLOUR.O ? TURN.O : TURN.X } = opt
    const pos =
        direction === DIRECTION.ASC
            ? posArr
            : posArr.map((_, i, arr) => posArr[arr.length - 1 - i])
    const playerOnHome = boardState.myBornOff()
    const opponentOnHome = boardState.opponentBornOff()
    const { home, bar } =
        direction === DIRECTION.ASC
            ? { home: 25, bar: 0 }
            : { home: 0, bar: 25 }
    return initBoard({
        turn,
        pos,
        ...diceRoll,
        playerOnHome,
        opponentOnHome,
        cube: cubeState.value,
        colour,
        direction,
        home,
        bar,
    })
}

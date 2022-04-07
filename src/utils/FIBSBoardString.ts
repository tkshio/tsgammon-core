export enum TURN {
    X,
    O,
    OVER,
}
export enum COLOUR {
    X,
    O,
}
export enum DIRECTION {
    ASC,
    DESC,
}
/**
 * FIBS形式文字列の各項目を要素とする型
 */
export type FIBSBoard = {
    matchLen: number
    playerScore: number
    opponentScore: number
    pos: number[]
    turn: TURN
    dice1: number
    dice2: number
    cube: number
    playerMayDouble: boolean
    opponentMayDouble: boolean
    wasDoubled: boolean
    colour: COLOUR
    direction: DIRECTION
    home: number
    bar: number
    playerOnHome: number
    opponentOnHome: number
    canMove: number
    _forcedMove: false
    _didCrawford: false
    redoubles: number
}

/**
 * 既定値を補ってFIBSBoardを生成する
 *
 * @param board
 * @returns
 */
export function initBoard(board?: Partial<FIBSBoard>): FIBSBoard {
    return {
        matchLen: 9999,
        playerScore: 0,
        opponentScore: 0,
        // prettier-ignore
        pos: [
             0,
            -2, 0, 0, 0,  0, 5,  0, 3, 0, 0, 0, -5,
             5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0,  2,
             0,
        ],
        turn: TURN.OVER,
        dice1: 0,
        dice2: 0,
        cube: 1,
        playerMayDouble: true,
        opponentMayDouble: true,
        wasDoubled: false,
        colour: COLOUR.X,
        direction: DIRECTION.DESC,
        home: 0,
        bar: 25,
        playerOnHome: 0,
        opponentOnHome: 0,
        canMove: 0,
        _forcedMove: false,
        _didCrawford: false,
        redoubles: 0,

        ...board,
    }
}
/**
 * FIBS形式の文字列を生成する
 *
 * http://www.fibs.com/fibs_interface.html#board_state
 *
 * @param board 局面
 * @param player 自分の名前
 * @param opponent 対戦相手の名前
 * @returns
 */
export function encodeFIBSBoardString(
    board: FIBSBoard,
    player = 'You',
    opponent = 'opponent'
): string {
    validate(board)
    const score3 = `${board.matchLen}:${board.playerScore}:${board.opponentScore}`
    const boardPos26 = `${board.pos.join(':')}`
    const turn = board.turn === TURN.OVER ? 0 : board.turn === TURN.O ? 1 : -1
    const dice4 =
        board.turn === TURN.OVER
            ? '0:0:0:0'
            : board.turn === TURN.O
            ? board.colour === COLOUR.O
                ? `${board.dice1}:${board.dice2}:0:0`
                : `0:0:${board.dice1}:${board.dice2}`
            : board.colour === COLOUR.X
            ? `${board.dice1}:${board.dice2}:0:0`
            : `0:0:${board.dice1}:${board.dice2}`
    const cube4 = `${board.cube}:${board.playerMayDouble ? 1 : 0}:${
        board.opponentMayDouble ? 1 : 0
    }:${board.wasDoubled ? 1 : 0}`
    const boardLayout4 = `${board.colour === COLOUR.O ? 1 : -1}:${
        board.direction === DIRECTION.ASC ? 1 : -1
    }:${board.home}:${board.bar}`
    const [playerOnTheBar, opponentOnTheBar] = (
        board.direction === DIRECTION.ASC
            ? [board.pos[0], board.pos[25]]
            : [board.pos[25], board.pos[0]]
    ).map(Math.abs)

    const pieces4 = `${board.playerOnHome}:${board.opponentOnHome}:${playerOnTheBar}:${opponentOnTheBar}`
    const movable3 = `${board.canMove}:${board._forcedMove ? 0 : 0}:${
        board._didCrawford ? 0 : 0
    }`
    const redoubles1 = board.redoubles
    return `board:${player}:${opponent}:${score3}:${boardPos26}:${turn}:${dice4}:${cube4}:${boardLayout4}:${pieces4}:${movable3}:${redoubles1}`
}

function validate(board: FIBSBoard) {
    if (board.pos.length != 26) {
        throw new Error('board length != 26, was:' + board.pos.length)
    }
}

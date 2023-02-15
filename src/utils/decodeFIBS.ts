import { boardState } from '../BoardState'
import { BoardStateNode } from '../BoardStateNode'
import { boardStateNode, nodeWithEmptyDice } from '../BoardStateNodeBuilders'
import { DicePip } from '../Dices'
import { COLOUR, DIRECTION, FIBSBoard, initBoard, TURN } from './FIBSBoard'
import { FIBSCube } from './FIBSCube'
import { FIBSScore, FIBSState } from './FIBSState'

/**
 * FIBS形式の文字列を解析する。
 * @param fibs FIBS形式の文字列
 * @returns 解析結果、不備がある場合は isValid:false が返る
 */
export function decodeFIBS(
    fibs: string
): { isValid: false } | ({ isValid: true } & FIBSState) {
    const arr = fibs.split(':')

    if (arr.length !== 53) {
        return { isValid: false }
    }
    const result = { isValid: true }
    function isInvalid(): undefined {
        result.isValid = false
        return undefined
    }
    const player = arr[1]
    const opponent = arr[2]

    const matchLen = parseInt(arr[3])
    const playerScore = parseInt(arr[4])
    const opponentScore = parseInt(arr[5])

    const pos = arr.slice(6, 32).map((n) => parseInt(n))
    const turn =
        arr[32] === '-1'
            ? TURN.X
            : arr[32] === '0'
            ? TURN.OVER
            : arr[32] === '1'
            ? TURN.O
            : isInvalid()
    const d1 = parseInt(arr[33])
    const d2 = parseInt(arr[34])
    const d3 = parseInt(arr[35])
    const d4 = parseInt(arr[36])
    const { dicePip1, dicePip2 } =
        d1 === 0 && d2 === 0
            ? { dicePip1: d3, dicePip2: d4 }
            : { dicePip1: d1, dicePip2: d2 }
    const { dice1, dice2 } = {
        dice1: asDicePip(dicePip1),
        dice2: asDicePip(dicePip2),
    }
    function asDicePip(pip: number): DicePip | 0 | undefined {
        if (pip === 0) {
            return 0
        }
        if (1 <= pip && pip <= 6) {
            return pip as DicePip
        }
        return isInvalid()
    }

    const cubeValue = parseInt(arr[37])
    const playerMayDouble = arr[38] === '1'
    const opponentMayDouble = arr[39] === '1'

    const colour =
        arr[41] === '-1' ? COLOUR.X : arr[41] === '1' ? COLOUR.O : isInvalid()
    const direction =
        arr[42] === '-1'
            ? DIRECTION.DESC
            : arr[42] === '1'
            ? DIRECTION.ASC
            : isInvalid()
    const playerOnHome = parseInt(arr[45])
    const opponentOnHome = parseInt(arr[46])
    const redoubles = parseInt(arr[52])

    if (!result.isValid) {
        return { isValid: false }
    }

    const fibsBoard = initBoard({
        player,
        opponent,
        matchLen,
        playerScore,
        opponentScore,
        pos,
        turn,
        dice1,
        dice2,
        cubeValue: cubeValue,
        playerMayDouble,
        opponentMayDouble,
        colour,
        direction,
        playerOnHome,
        opponentOnHome,
        redoubles,
    })

    const node = toNode(fibsBoard)
    const cube = toCube(fibsBoard)
    const matchScore = toMatchScore(fibsBoard)
    return { isValid: true, player, opponent, node, cube, matchScore }
}

function toNode(fibs: FIBSBoard): BoardStateNode {
    const posArr =
        fibs.direction === DIRECTION.ASC
            ? fibs.pos
            : fibs.direction === DIRECTION.DESC
            ? fibs.pos.map((_, idx, array) => array[array.length - 1 - idx])
            : ([] as number[])

    const pos =
        fibs.colour === COLOUR.O
            ? posArr
            : fibs.colour === COLOUR.X
            ? posArr.map((p) => (p === 0 ? 0 : -p))
            : ([] as number[])
    const fibsBoard = boardState(pos, [fibs.playerOnHome, fibs.opponentOnHome])

    const board =
        (fibs.turn === TURN.O && fibs.colour === COLOUR.X) ||
        (fibs.turn === TURN.X && fibs.colour === COLOUR.O)
            ? fibsBoard.revert()
            : fibsBoard

    const { dice1, dice2 } = fibs
    return dice1 === 0 || dice2 === 0
        ? nodeWithEmptyDice(board)
        : boardStateNode(board, { dice1, dice2 }).root
}

function toCube(fibs: FIBSBoard): FIBSCube {
    return {
        cubeValue: fibs.cubeValue,
        playerMayDouble: fibs.playerMayDouble,
        opponentMayDouble: fibs.opponentMayDouble,
    }
}
function toMatchScore(fibs: FIBSBoard): FIBSScore {
    return {
        matchLen: fibs.matchLen,
        playerScore: fibs.playerScore,
        opponentScore: fibs.opponentScore,
    }
}

import { encode as encodeAsBase64 } from '@borderless/base64'

import { cube, CubeOwner } from '../../CubeState'
import { GameState } from '../GameState'
import { MatchState } from '../MatchState'

export function toMatchID(matchState: MatchState) {
    const { gameState } = matchState
    const cubeState =
        gameState.tag === 'GSInit' ? cube(1) : gameState.cbState.cubeState

    // 1. Bit 1-4 contains the 2-logarithm of the cube value. For example, a 8-cube is encoded as 0011 binary (or 3), since 2 to the power of 3 is 8. The maximum value of the cube in with this encoding is 2 to the power of 15, i.e., a 32768-cube.
    const bit1_4 = Math.log2(cubeState.value)

    // 2. Bit 5-6 contains the cube owner. 00 if player 0 owns the cube, 01 if player 1 owns the cube, or 11 for a centered cube.
    const bit5_6 =
        cubeState.owner === CubeOwner.RED
            ? 0
            : cubeState.owner == CubeOwner.WHITE
            ? 1
            : 3

    // 3. Bit 7 is the player on roll or the player who did roll (0 and 1 for player 0 and 1, respectively).
    const bit7 =
        gameState.tag === 'GSInPlay' ? (gameState.sgState.isRed ? 0 : 1) : 0

    // 4. Bit 8 is the Crawford flag: 1 if this game is the Crawford game, 0 otherwise.
    const bit8 = gameState.isCrawford ? 1 : 0

    // 5. Bit 9-11 is the game state: 000 for no game started, 001 for playing a game, 010 if the game is over, 011 if the game was resigned, or 100 if the game was ended by dropping a cube.
    const bit9_11 =
        gameState.tag === 'GSInit'
            ? 0
            : gameState.tag === 'GSOpening' || gameState.tag === 'GSInPlay'
            ? 1
            : gameState.cbState.isWonByPass
            ? 4
            : gameState.isWonByResign
            ? 3
            : 2

    // 6. Bit 12 indicates whose turn it is. For example, suppose player 0 is on roll then bit 7 above will be 0. Player 0 now decides to double, this will make bit 12 equal to 1, since it is now player 1's turn to decide whether she takes or passes the cube.
    const bit12 =
        gameState.tag === 'GSInit' || gameState.tag === 'GSOpening'
            ? 0
            : gameState.cbState.tag === 'CBEoG'
            ? 0
            : gameState.cbState.isRed
            ? 0
            : 1

    // 7. Bit 13 indicates whether an doubled is being offered. 0 if no double is being offered and 1 if a double is being offered.
    const bit13 =
        gameState.tag === 'GSInPlay' && gameState.cbState.tag === 'CBResponse'
            ? 1
            : 0

    // Bit 14-15 indicates whether an resignation was offered. 00 for no resignation, 01 for resign of a single game, 10 for resign of a gammon, or 11 for resign of a backgammon. The player offering the resignation is the inverse of bit 12, e.g., if player 0 resigns a gammon then bit 12 will be 1 (as it is now player 1 now has to decide whether to accept or reject the resignation) and bit 13-14 will be 10 for resign of a gammon.
    const bit14_15 = isResignOffered(gameState) ? 1 : 0

    // Bit 16-18 and bit 19-21 is the first and second die, respectively. 0 if the dice has not yet be rolled, otherwise the binary encoding of the dice, e.g., if 5-2 was rolled bit 16-21 will be 101-010.
    const { dice1, dice2 } = dices(gameState)
    const bit16_18 = dice1 > dice2 ? dice1 : dice2
    const bit19_21 = dice1 > dice2 ? dice2 : dice1

    // Bit 22 to 36 is the match length. The maximum value for the match length is 32767. A match score of zero indicates that the game is a money game.
    const bit22_36 = matchState.matchLength

    // Bit 37-51 and bit 52-66 is the score for player 0 and player 1 respectively. The maximum value of the match score is 32767.
    const bit37_51 = matchState.matchScore.redScore
    const bit52_66 = matchState.matchScore.whiteScore

    // Bit67 : no Jacoby: これはドキュメントに記載がない：Jacobyが無効（ポイントマッチ）なら1, 有効（マネーゲームなど）なら0
    const bit67 = matchState.isJacoby ? 0 : 1

    const toEnc = [
        { bit: bit1_4, len: 4 },
        { bit: bit5_6, len: 2 },
        { bit: bit7 },
        { bit: bit8 },
        { bit: bit9_11, len: 3 },
        { bit: bit12 },
        { bit: bit13 },
        { bit: bit14_15, len: 2 },
        { bit: bit16_18, len: 3 },
        { bit: bit19_21, len: 3 },
        { bit: bit22_36, len: 15 },
        { bit: bit37_51, len: 15 },
        { bit: bit52_66, len: 15 },
        { bit: bit67 },
    ]

    const buffer = new ArrayBuffer(9)
    const reducer = littleEndianReducer(buffer)
    toEnc.map(revertBits).reduce(reducer)
    return {
        matchID: encodeAsBase64(buffer).substring(0, 12),
        cube: bit1_4,
        cubeOwner: bit5_6,
        diceOwner: bit7,
        crawford: bit8,
        gameState: bit9_11,
        turnOwner: bit12,
        double: bit13,
        resign: bit14_15,
        dice1: bit16_18,
        dice2: bit19_21,
        matchLen: bit22_36,
        score1: bit37_51,
        score2: bit52_66,
        noJacoby: bit67,
        bit: Array.from(new Uint8Array(buffer)).map((b) => b.toString(2)),
    }
}

function dices(gameState: GameState): { dice1: number; dice2: number } {
    return gameState.tag === 'GSInPlay' && gameState.sgState.tag === 'SGInPlay'
        ? {
              dice1: gameState.sgState.dices[0].pip,
              dice2: gameState.sgState.dices[1].pip,
          }
        : { dice1: 0, dice2: 0 }
}

function isResignOffered(gameState: GameState) {
    return gameState.tag === 'GSEoG' && gameState.isWonByResign
}

function revertBits(v: Bit): Bit {
    let n = v.bit
    let ret = 0
    for (let i = 0; i < (v.len ?? 1); i++) {
        ret = (ret << 1) | (n & 1)
        n = n >> 1
    }
    return { bit: ret, len: v.len }
}

export function littleEndianReducer(
    buffer: ArrayBuffer,
    pos = 0
): (prev: Bit, value: Bit, idx: number, arr: Bit[]) => Bit {
    const dataView = new DataView(buffer)
    const byteWriter = {
        pos,
        write: (value: number) => {
            if (byteWriter.pos < buffer.byteLength) {
                dataView.setUint8(byteWriter.pos, revertByte(value))
                byteWriter.pos += 1
            }
        },
    }

    return (prev: Bit, value: Bit, idx: number, arr: Bit[]) => {
        // データの最後になったら、とにかく1バイト分書くように補完する
        const isLast = idx == arr.length - 1
        return accumulateBit(prev, value, byteWriter.write, isLast)
    }

    // little endian に変換
    function revertByte(v: number) {
        return (
            (v & 1) * 128 +
            ((v >> 1) & 1) * 64 +
            ((v >> 2) & 1) * 32 +
            ((v >> 3) & 1) * 16 +
            ((v >> 4) & 1) * 8 +
            ((v >> 5) & 1) * 4 +
            ((v >> 6) & 1) * 2 +
            ((v >> 7) & 1)
        )
    }
}

/**
 * 任意の長さのビット列を表す
 */
export type Bit = {
    bit: number
    len?: number
}

/**
 * 与えられたビット列を既存のビット列の後に接続し、1バイト以上になれば
 * 各バイトごとにbyteConsumerに渡して切り捨てた結果を返す
 * @param prev 既存のビット列
 * @param value prevに付加するビット列
 * @param byteConsumer 1バイトごとに呼ばれる関数
 * @param isLast valueが最後であるならtrue(1バイトに足りない分を0で詰めてbyteConsumerを呼ぶ)
 * @returns
 */
function accumulateBit(
    prev: Bit,
    value: Bit,
    byteConsumer: (b: number) => void,
    isLast = false
): Bit {
    let { bit: curBit = 0 } = prev
    const { len: lastLen = 0 } = prev
    let { bit, len = 1 } = value

    // bitが1バイト分に満たないうちは、追加されたbitを保持する
    // ただし、データの最後になったら、とにかく1バイト分書く
    let curLen = lastLen + len
    if (curLen < 8) {
        if (!isLast) {
            return {
                bit: (curBit << len) | bit,
                len: curLen,
            }
        }
        // データの最後で、書き込む分が1バイトに満たなければ0を詰める
        bit = bit << (8 - curLen)
        len = len + (8 - curLen)
    }

    // オーバーフローしないようにマスク
    bit = bit & ((1 << len) - 1)

    // まず以前から引き継いでいるbitがあれば、1バイト分書き出す
    if (lastLen > 0) {
        const shiftForLast = 8 - lastLen
        const shiftForCur = len - shiftForLast // == lenToWrite - 8 なので、常に > 0
        const valueToWrite = (curBit << shiftForLast) | (bit >> shiftForCur)

        byteConsumer(valueToWrite)

        curLen -= 8
        curBit = ((1 << shiftForCur) - 1) & bit
    } else {
        curBit = bit
    }

    // 新規追加のbitから1バイト分書ける分を全部書き出す
    while (curLen >= 8) {
        const shiftForCur = curLen - 8
        const valueToWrite = (curBit >> shiftForCur) & 255
        byteConsumer(valueToWrite)

        curLen -= 8
        curBit = ((1 << shiftForCur) - 1) & curBit
    }

    // 最後の場合は、まだ残っているビットに0を詰めて出力する
    if (isLast && curLen > 0) {
        const valueToWrite = (curBit << (8 - curLen)) & 255
        byteConsumer(valueToWrite)
        // 一応一貫性のある値を返させる
        curLen = 0
        curBit = 0
    }

    // 1バイトに満たない分を次に引き継ぐ(len<8が保証される)
    return { bit: curBit, len: curLen }
}

import { decode as decodeBase64 } from '@borderless/base64'
import { boardState, BoardState } from '../BoardState'

export function decodePosID(positionID: string):
    | {
          isValid: true
          board: BoardState
      }
    | { isValid: false } {
    const ret = decodePosIDAsArray(positionID)
    return ret.isValid
        ? {
              isValid: true,
              board: boardState(ret.pos, [ret.myBornOff, ret.oppBornOff]),
          }
        : ret
}

export function decodePosIDAsArray(positionID: string):
    | {
          isValid: true
          pos: number[]
          myBornOff: number
          oppBornOff: number
      }
    | { isValid: false } {
    if (positionID.length < 14) {
        return { isValid: false }
    }

    const decoded = new Uint8Array(
        decodeBase64(positionID.substring(0, 14))
    ).reduce(
        (prev: { cur: number; pos: number[] }, n: number) => {
            const pos = prev.pos
            let cur = prev.cur
            // Base64からデコードしたOctetを、さらにビットごとの配列にする
            // prettier-ignore
            const enc = [
                n & 1, n & 2, n & 4, n & 8,
                n & 16, n & 32, n & 64, n & 128,
            ]
            // 1なら今見ているポイントに駒を1つ追加、0なら次のポイントへ
            enc.forEach((b) => {
                if (b) {
                    if (cur < pos.length) {
                        // 動作上は不要だが、一応
                        pos[cur] = pos[cur] + 1
                    }
                } else {
                    cur++
                }
            })
            return { cur, pos }
        },
        { cur: 0, pos: Array(50).fill(0) }
    ).pos

    // 自分と相手の駒数が別々の場所に格納されているので、BoardState用に変換する
    const ret = [...new Array(26)].map((_, pos) => {
        if (pos === 0) {
            // my bar point
            return decoded[49]
        } else if (pos === 25) {
            // opponents bar point
            return -decoded[24]
        } else {
            // pos[1] <= -decoded[0] + decoded[48]
            // pos[2] <= -decoded[1] + decoded[47]
            // ...
            // pos[24]<= -decoded[23] + decoded[25]
            return -decoded[pos - 1] + decoded[49 - pos]
        }
    })

    // PositionID自体は、ベアリングオフした駒の数を意識しない
    const myPieces = ret
        .filter((n) => n > 0)
        .reduce((prev, cur) => prev + cur, 0)
    const oppPieces = ret
        .filter((n) => n < 0)
        .reduce((prev, cur) => prev - cur, 0)

    return {
        isValid: true,
        pos: ret,
        myBornOff: 15 - myPieces,
        oppBornOff: 15 - oppPieces,
    }
}

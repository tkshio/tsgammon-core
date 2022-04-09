import { Move } from '../Move'

/**
 * '1/2 2/3', '24/23 23/22' など駒の移動を表す文字列を、Moveの配列に変換する
 *
 * ※ Moveは相対表記なので、全てfrom<toとなるように変換される（上記はいずれも1/2 2/3扱い）
 *
 * '1/2/3'(一つの駒の連続移動) '1/2(2)'（複数の駒を同じように動かす）もサポートされる。
 *
 * @param s 駒の移動を表す文字列
 * @param boardSize デフォルトは24
 * @returns 正常に解析できたMoveの配列
 */
export function decodeMoves(s: string, boardSize = 24): Move[] {
    const moves = s.trim().split(/\s+/)
    if (moves.length === 1 && moves[0] === '') {
        return []
    }

    return moves
        .flatMap((move) => {
            // convert a/b(n) into a/b a/b ... a/b
            const match = move.match(/^(.+)\(([0-9]+)\)$/)
            if (match) {
                const n = Number(match[2])
                return Array(n).fill(match[1])
            }
            return move
        })
        .flatMap((move) => {
            // convert a/b/c => a/b b/c
            const moves = move.split('/')
            if (moves.length <= 2) {
                return move
            }
            return [...Array(moves.length - 1)].map(
                (_: unknown, index: number) =>
                    moves[index] + '/' + moves[index + 1]
            )
        })
        .map((s) => s.trim())
        .map((s) => decodeMove(s, boardSize))
        .filter(
            (
                m: { isValid: false } | ({ isValid: true } & Move)
            ): m is { isValid: true } & Move => m.isValid
        )
}

export function decodeMove(
    s: string,
    boardSize = 24
): { isValid: false } | ({ isValid: true } & Move) {
    // get from, to, isHit(*) e.g. 12/13*
    const match = s.match(/^([0-9]+|bar)\*?\/([0-9]+|off)(\*?)$/i)
    if (!match) {
        return { isValid: false }
    }
    const from = Number(match[1])
    const to = Number(match[2])
    const isHit = match[3] === '*'

    const isReenter = Number.isNaN(from)
    const isBearOff = Number.isNaN(to)
    if (isReenter && isBearOff) {
        return { isValid: false }
    }
    const MID = boardSize / 2
    const BAR = boardSize + 1
    const from_to = isReenter
        ? { from: 0, to: to < MID ? to : invert(to) }
        : isBearOff
        ? { from: MID < from ? from : invert(from), to: BAR }
        : from < to
        ? { from, to }
        : { from: invert(from), to: invert(to) }

    const pip = to - from
    return {
        isValid: true,
        ...from_to,
        pip,
        isHit,
        isBearOff,
        isOverrun: false,
    }

    function invert(pos: number) {
        return BAR - pos
    }
}

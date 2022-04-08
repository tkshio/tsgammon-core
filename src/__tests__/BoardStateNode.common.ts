import { boardStateNodeFromArray } from '../BoardStateNode'
import { collectMoves } from '../utils/collectMoves'
import { DicePip } from '../Dices'
import { Move } from '../Move'

type Moves = [number, number, boolean?][]
type BasicTestArg = {
    pos: number[]
    diceRoll: [DicePip, DicePip]
    expectedMoves: Moves[]
    expectedRedundancy?: boolean[]
}

export function move(from: number, to: number, isHit?: boolean): Move {
    return {
        from: from,
        to: to,
        pip: to - from,
        isHit: !!isHit,
        isBearOff: to >= 25,
        isOverrun: to > 25,
    }
}

function sortMove(m1: Move, m2: Move): number {
    const from = m1.from - m2.from
    if (from !== 0) {
        return from
    }
    const to = m1.to - m2.to
    if (to !== 0) {
        return to
    }
    const pip = m1.pip - m2.pip
    if (pip !== 0) {
        return pip
    }
    if (m1.isHit && !m2.isHit) {
        return 1
    }
    if (!m1.isHit && m2.isHit) {
        return -1
    }
    if (m1.isBearOff && !m2.isBearOff) {
        return 1
    }
    if (!m1.isBearOff && m2.isBearOff) {
        return -1
    }
    if (m1.isOverrun && !m2.isOverrun) {
        return 1
    }
    if (!m1.isOverrun && m2.isOverrun) {
        return -1
    }
    return 0
}
export function sortMoves(m1: Move[], m2: Move[]): number {
    if (m1.length !== m2.length) {
        return m1.length - m2.length
    }
    for (let index = 0; index < m1.length; index++) {
        const s = sortMove(m1[index], m2[index])
        if (s !== 0) {
            return s
        }
    }
    return 0
}

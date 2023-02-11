/**
 * 終局状態を示す
 */
export type EOGStatus = {
    isEndOfGame: boolean
    isGammon: boolean
    isBackgammon: boolean
    calcStake(cubeValue: number): number
}

export function eog(status?: Partial<EOGStatus>): EOGStatus {
    return {
        isEndOfGame: true,
        isGammon: false,
        isBackgammon: false,
        calcStake(cubeValue = 1) {
            return cubeValue * (this.isBackgammon ? 3 : this.isGammon ? 2 : 1)
        },
        ...status,
    }
}

export const inGame: EOGStatus = eog({
    isEndOfGame: false,
    isGammon: false,
    isBackgammon: false,
})

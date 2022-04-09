/**
 * キューブの所有者を表す
 */
export enum CubeOwner {
    WHITE = 1,
    RED,
}

/**
 * キューブの状態
 */
export type CubeState = {
    /**
     * キューブの現在の値
     */
    value: number

    /**
     * キューブがどちらの側にあるか。未ダブルの場合はundefined
     */
    owner?: CubeOwner

    /**
     * キューブの最大値に達した (これ以上ダブルできない)ならtrue
     */
    isMax: boolean

    /**
     * ダブル後の状態のキューブを生成する
     * @param newOwner 新たなキューブの所有者、すなわちダブルをかけられた側
     */
    double(newOwner: CubeOwner): CubeState

    /**
     * ダブル後のキューブの値を返す（すなわち、現在の値の2倍）
     */
    doubledValue: number

    /**
     * 指定された側がダブルできるかどうか
     * @param side ダブルしようとしている側（赤か白）
     */
    mayDoubleFor(side: CubeOwner): boolean
}

/**
 * 新たにCubeを生成する
 *
 * @param value キューブの値
 * @param owner キューブの所有者
 * @param max キューブの最大値
 * @returns
 */
export function cube(value: number, owner?: CubeOwner, max = 512): CubeState {
    const isMax = max <= value
    const doubledValue = isMax ? value : ((value * 2) as number)
    return {
        value,
        owner,
        isMax,
        double(newOwner: CubeOwner): CubeState {
            return cube(doubledValue, newOwner, max)
        },
        doubledValue,
        mayDoubleFor(side: CubeOwner) {
            return mayDoubleFor(isMax, owner, side)
        },
    }
}

// ダブルできるかどうか
function mayDoubleFor(
    isMax: boolean,
    owner: CubeOwner | undefined,
    side: CubeOwner
): boolean {
    return !isMax && (owner === undefined || owner === side)
}

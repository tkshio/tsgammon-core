import { boardState } from '../BoardState'
import { cube } from '../CubeState'
import { GameConf } from '../GameConf'
import { standardConf } from '../GameConfs'
import { cbOpening } from './CubeGameState'
import { openingState } from './SingleGameState'

/**
 * ルール設定から、デフォルト状態＝各ゲーム開始時の状態を表すBGStateオブジェクトを生成する
 * @param gameConf ルール設定
 * @returns
 */
export function defaultBGState(gameConf: GameConf = standardConf) {
    return {
        cbState: cbOpening(cube(1)),
        sgState: defaultSGState(gameConf),
    }
}

/**
 * ルール設定から、デフォルト状態＝各ゲーム開始時の状態を表すSGStateオブジェクトを生成する
 * @param gameConf ルール設定
 * @returns
 */
export function defaultSGState(gameConf: GameConf = standardConf) {
    return openingState(
        boardState(gameConf.initialPos, [0, 0], gameConf.innerPos),
        undefined
    )
}

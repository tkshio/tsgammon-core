import { PlyRecordInPlay } from './PlyRecord'

/**
 * 手番の記録と、局面を表す任意のオブジェクトとの対を表す
 *
 * @template T 局面を表す任意のオブジェクトの型
 */
export type PlyStateRecord<T> = {
    plyRecord: PlyRecordInPlay
    state: T
}

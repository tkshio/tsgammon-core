import { BoardState } from './BoardState'

/**
 * 駒配置、ルールなどの定義
 */
export type GameConf = {
    /**
     * 名称
     */
    name: string
    /**
     * 初期配置は、対局開始時の駒配置を示すとともに、駒の総数の算出の基礎としても使用される
     */
    initialPos: number[]
    /**
     * インナーボードの位置
     */
    innerPos: number
    /**
     * キューブの最大値。cubeMaxに達するとダブルできなくなる。
     * cubeMaxが512なら、キューブは512にまで上がる可能性があり、1024には上がらない。
     */
    cubeMax: number

    /**
     * ジャコビールールを適用するかどうか
     */
    jacobyRule: boolean

    /**
     * ゾロ目が出た場合の動かす駒の数
     */
    movesForDoublet?: number

    /**
     * 終局判定関数、省略時は全ての駒を上りにしたら終局
     */
    isEoGFunc?: (board: BoardState) => boolean
}

export const standardConf: GameConf = {
    name: 'Backgammon',
    initialPos: [
        0, 2, 0, 0, 0, 0, -5, 0, -3, 0, 0, 0, 5, -5, 0, 0, 0, 3, 0, 5, 0, 0, 0,
        0, -2, 0,
    ],
    innerPos: 19,
    cubeMax: 1024,
    jacobyRule: false,
}

export const honsugorokuConf: GameConf = {
    ...standardConf,
    name: 'HonSugoroku',
    /**
     * ゾロ目の時も動かせるコマは二つ
     */
    movesForDoublet: 2,
    /**
     * キューブは使わない
     */
    cubeMax: 1,
    /**
     * キューブがないので、常にギャモン・バックギャモンは有効
     */
    jacobyRule: false,
    /**
     * 駒が全てインナーに入ったら勝利、ただし、相手がヒットできる可能性があれば続行
     * その場合、未使用の目がある限り、ベアオフするかムーブするかしないといけない
     */
    isEoGFunc: (board: BoardState) => {
        // ベアオフ可能 = 全ての駒がインナーに入っていなければ続行
        if (!board.isBearable) {
            return false
        }

        // 相手にヒットの可能性がある場合は続行
        if (board.opponentLastPiecePos >= board.innerPos) {
            for (let i = board.innerPos; i <= board.opponentLastPiecePos; i++) {
                if (board.piecesAt(i) === 1) {
                    return false
                }
            }
        }
        return true
    },
}

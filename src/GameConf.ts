import { SGTransition } from './states/SGTransition'

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

    transition: SGTransition
}

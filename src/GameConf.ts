
/**
 * 駒配置、ルールなどの定義
 */
export type GameConf = {
    /**
     * 初期配置は、対局開始時の駒配置を示すとともに、駒の総数の算出の基礎としても使用される
     */
    initialPos: number[];
    /**
     * キューブの最大値。cubeMaxに達するとダブルできなくなる。
     * cubeMaxが512なら、キューブは512にまで上がる可能性があり、1024には上がらない。
     */
    cubeMax: number;

    /**
     * ジャコビールールを適用するかどうか（未実装）
     */
    jacobyRule: boolean;
};

export const standardConf: GameConf = {
    initialPos: [
        0,
        2, 0, 0, 0, 0, -5, 0, -3, 0, 0, 0, 5,
        -5, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, -2,
        0
    ],
    cubeMax : 1024,
    jacobyRule: true
}

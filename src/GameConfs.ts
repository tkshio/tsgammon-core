import { GameConf } from './GameConf'
import { standardTransition, sugorokuTransition } from './states/SGTransitions'

const standardInitialPos = [
    0, 2, 0, 0, 0, 0, -5, 0, -3, 0, 0, 0, 5, -5, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0,
    -2, 0,
]

export const standardConf: GameConf = {
    name: 'Backgammon',
    initialPos: standardInitialPos,
    innerPos: 19,
    cubeMax: 1024,
    jacobyRule: false,
    transition: standardTransition,
}

export const honsugorokuConf: GameConf = {
    ...standardConf,
    name: 'HonSugoroku',
    /**
     * キューブは使わない
     */
    cubeMax: 1,
    /**
     * キューブがないので、常にギャモン・バックギャモンは有効
     */
    jacobyRule: false,
    transition: sugorokuTransition,
}

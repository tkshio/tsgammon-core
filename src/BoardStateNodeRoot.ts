import { BoardStateNode } from './BoardStateNode'
import { Dice } from './Dices'

export type BoardStateNodeRoot = {
    root: BoardStateNode
    minorFirst?: BoardStateNode
    dices: Dice[]
    hasValue: true
    isRoot: true
}

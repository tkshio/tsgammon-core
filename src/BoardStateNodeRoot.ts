import { BoardStateNode } from './BoardStateNode'
import { Dice } from './Dices'

export type BoardStateNodeRoot = {
    root: BoardStateNode
    alternate?: BoardStateNode
    dices: Dice[]
    hasValue: true
    isRoot: true
}

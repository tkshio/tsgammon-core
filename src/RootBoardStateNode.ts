import { BoardStateNode } from './BoardStateNode'
import { Dice } from './Dices'

export type RootBoardStateNode = {
    root: BoardStateNode
    swapped?: BoardStateNode
    dices: Dice[]
    hasValue: true
}

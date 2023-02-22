import { BoardStateNode } from './BoardStateNode'
import { DicePip } from './Dices'

export type BoardStateNodeRoot = {
    root: BoardStateNode
    minorFirst?: BoardStateNode
    dices: DicePip[]
    hasValue: true
    isRoot: true
}

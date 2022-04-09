import { BoardStateNode } from '../BoardStateNode'
import { FIBSCube } from './FIBSCube'

export type FIBSState = {
    player: string
    opponent: string
    node: BoardStateNode
    cube: FIBSCube
    matchScore: FIBSScore
}

export type FIBSScore = {
    matchLen: number
    playerScore: number
    opponentScore: number
}

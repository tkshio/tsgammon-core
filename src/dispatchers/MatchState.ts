import { Score } from '../Score'
import { GameState } from './GameState'

export type MatchState = {
    matchLength: number
    matchScore: Score
    gameState: GameState
    isJacoby: boolean
}

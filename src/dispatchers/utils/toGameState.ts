import { GameState } from '../../GameState'
import { BGState } from '../BGState'
import { ResignState } from '../ResignState'

export function toGameState(bgState: BGState, rsState: ResignState): GameState {
    const { cbState, sgState } = bgState
    switch (cbState.tag) {
        case 'CBOpening':
            return {
                tag: 'GSOpening',
                cubeState: cbState.cubeState,
            }

        case 'CBEoG':
            return {
                tag: 'GSEoG',
                cubeState: cbState.cubeState,
                isWonByResign: rsState.tag === 'RSOffered',
                isWonByPass: cbState.isWonByPass,
            }

        default:
            return {
                tag: 'GSInPlay',
                cubeState: cbState.cubeState,
                isResignOffered: rsState.tag === 'RSOffered',
                isDoubleOffered: cbState.tag === 'CBResponse',
                offer: rsState.tag === 'RSOffered' ? rsState.offer : undefined,
                dices: sgState.tag === 'SGInPlay' ? sgState.dices : undefined,
                isRed:
                    rsState.tag === 'RSOffered' ? rsState.isRed : cbState.isRed,
            }
    }
}

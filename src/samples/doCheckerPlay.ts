import { SingleGameEventHandlers } from '../dispatchers/SingleGameEventHandlers'
import { SGState } from '../dispatchers/SingleGameState'
import { GammonEngine } from '../engines/GammonEngine'

export function doCheckerPlay(
    engine: GammonEngine,
    sgState: SGState,
    sgEventHandlers: SingleGameEventHandlers
) {
    switch (sgState.tag) {
        case 'SGOpening': {
            sgEventHandlers.onRollOpening(sgState)
            break
        }
        case 'SGInPlay': {
            const curNode = sgState.boardStateNode
            const nextNode = engine.checkerPlay(curNode)
            sgEventHandlers.onCommit(sgState.withNode(nextNode))
            break
        }
        case 'SGToRoll': {
            sgEventHandlers.onRoll(sgState)
            break
        }
        case 'SGEoG':
            break
    }
}

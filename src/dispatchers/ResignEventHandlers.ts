import { EOGStatus, eog } from '../EOGStatus'
import { SGResult } from '../records/SGResult'
import { rsNone, ResignOffer, RSOffered } from './ResignState'

export const RSNONE = rsNone()

export type ResignEventHandlers = {
    onOfferResign: (offer: ResignOffer, isRed: boolean) => RSOffered
    onRejectResign: (resignState: RSOffered) => void
    onAcceptResign: (resignState: RSOffered) => void
}

export function resignEventHandlers(listeners: {
    offerResign: (resignState: RSOffered) => void
    acceptResign: (result: SGResult, eogStatus: EOGStatus) => void
    rejectResign: (resignState: RSOffered) => void
}): ResignEventHandlers {
    return {
        onOfferResign: (offer: ResignOffer, isRed: boolean) =>
            isRed ? offerFromRedToWhite(offer) : offerFromWhiteToRed(offer),
        onRejectResign: (resignState: RSOffered) => {
            listeners.rejectResign(resignState)
        },
        onAcceptResign: (resignState: RSOffered) => {
            const offer = resignState.offer
            // resignState（=ResignをOfferされた側）がRedなら、Redの勝利
            const result = resignState.isRed
                ? SGResult.REDWON
                : SGResult.WHITEWON
            const eogStatus = eog({
                isGammon:
                    offer === ResignOffer.Gammon ||
                    offer === ResignOffer.Backgammon,
                isBackgammon: offer === ResignOffer.Backgammon,
            })
            listeners.acceptResign(result, eogStatus)
        },
    }

    function offerFromRedToWhite(offer: ResignOffer): RSOffered {
        const offered = RSNONE.doOfferResignRed(offer)
        listeners.offerResign(offered)
        return offered
    }

    function offerFromWhiteToRed(offer: ResignOffer): RSOffered {
        const offered = RSNONE.doOfferResignWhite(offer)
        listeners.offerResign(offered)
        return offered
    }
}

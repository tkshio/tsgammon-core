import { ResignOffer } from '../ResignOffer'

export type ResignState = RSNone | RSOffered

export type RSNone = {
    tag: 'RSNone'
    doOfferResignRed(offer: ResignOffer): RSOfferedWhite
    doOfferResignWhite(offer: ResignOffer): RSOfferedRed
}

export type RSOffered = RSOfferedWhite | RSOfferedRed

type _RSOffered = { tag: 'RSOffered'; offer: ResignOffer }
export type RSOfferedWhite = _RSOffered & { isRed: false }
export type RSOfferedRed = _RSOffered & { isRed: true }

export const RSNONE = rsNone()

function rsNone(): RSNone {
    return {
        tag: 'RSNone',
        doOfferResignRed: (offer: ResignOffer) => rsOfferedWhite(offer),
        doOfferResignWhite: (offer: ResignOffer) => rsOfferedRed(offer),
    }
}

export function rsOfferedRed(offer: ResignOffer): RSOfferedRed {
    return { isRed: true, tag: 'RSOffered', offer }
}

export function rsOfferedWhite(offer: ResignOffer): RSOfferedWhite {
    return { isRed: false, tag: 'RSOffered', offer }
}

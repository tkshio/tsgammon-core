import { rsNone, ResignOffer, RSOffered } from './ResignState'

export const RSNONE = rsNone()

export type ResignEventHandler = {
    onOfferResign: (offer: ResignOffer, isRed: boolean) => void
    onRejectResign: (resignState: RSOffered) => void
    onAcceptResign: (resignState: RSOffered) => void
}

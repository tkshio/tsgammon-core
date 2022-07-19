import { RSOffered } from './ResignState'
import { ResignOffer } from '../ResignOffer'

export type ResignEventHandler = {
    onOfferResign: (offer: ResignOffer, isRed: boolean) => void
    onRejectResign: (resignState: RSOffered) => void
    onAcceptResign: (resignState: RSOffered) => void
}

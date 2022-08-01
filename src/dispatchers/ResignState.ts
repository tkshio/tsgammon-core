import { ResignOffer } from '../ResignOffer'

/**
 * 降参状態を示す：ここでは降参を申し出ているか、何もないかの状態しかなく、
 * どの条件で降参するかを選択するための状態遷移は、U.I.側の管理に委ねている
 */
export type ResignState = RSNone | RSOffered

/** 降参が始まっていない状態を表す：意味のある情報は保持していないので、
 * 個別にオブジェクトは生成せず、シングルトンであるRSNONEを使用する */
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

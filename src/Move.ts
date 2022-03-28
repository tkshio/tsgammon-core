/**
 * 相対表記で表した指し手（駒一つを一回動かす）を表す。{@link BoardState}の操作において使用する。
 */
export type Move = {
    /** 開始位置 */
    from: number;

    /** 終了位置。オーバーランの場合、上がり位置は25より大きくなる。 */
    to: number;

    /** 移動量 */
    pip: number;

    /** ヒットの場合はtrue */    
    isHit: boolean;

    /** 上がりの場合はtrue */
    isBearOff: boolean;

    /** 本来必要なダイスの目より大きい目で上がった場合はtrue */
    isOverrun: boolean;
};

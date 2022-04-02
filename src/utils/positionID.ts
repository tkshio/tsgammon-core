import { encode as encodeBase64 } from '@borderless/base64'
import { BoardState } from '../BoardState'

export function encode(
    board: BoardState
): { isValid: false } | { isValid: true; positionID: string } {
    // PositionIDのエンコーディングは、インデックスを遡って駒を数えていく
    // [24,23,...,1,0 = bar]
    const myIndex = [...Array(25)].map((_, i, arr) => arr.length - i - 1)
    const myPieces = myIndex
        .map((pos) => board.piecesAt(pos))
        .map((n) => (n > 0 ? n : 0))

    // [1,2,...,24, 25=bar]
    const oppIndex = [...Array(25)].map((_, i) => i + 1)
    const oppPieces = oppIndex
        .map((pos) => board.piecesAt(pos))
        .map((n) => (n < 0 ? -n : 0))

    const buffer = new ArrayBuffer(10)

    // GNU Backgammonの説明と順序が違うが、これでよいようだ
    const v = oppPieces
        .concat(myPieces)

        // reduceにより、各ポイントの駒数nをn+1個のbit列に変換し（e.g. 3=>0111）、
        // それを順次8bitずつにまとめてbufferに詰め込んでいく
        .reduce(
            (
                prev: {
                    lastBit: number // 前回書き残しのビット列（先頭が0、以降は1）
                    lastLen: number // 前回の書き残しのビット列の長さ（1の数+1）
                    dataView: DataView // バイト単位で変換結果を保持(10byte分)
                    pos: number // dataViewの、次の書き込み先(0 - 9)
                },
                n: number
            ) => {
                // もうバッファに書き込めない場合（コマの数が多すぎる）は、何もしない
                if (prev.pos >= 10) {
                    return prev
                }

                const { lastBit, lastLen, dataView, pos } = prev

                // バッファに書き込む量に達しない場合は、次に引き継ぐ
                if (n + lastLen < 8) {
                    // n1個の1（0->0, 1->1, 2->11, 3->111, 4->1111...）を用意
                    const bitForNext = (1 << n) - 1
                    const bitForNextLen = n + 1

                    // 先頭には0をつけるので、長さは上記のbit列より1bit長くなる
                    //     この先頭の0は、必ず次回のループ初回で書き込まれるか、
                    //     ループをスルーしてその次へ引き継がれるかのいずれか
                    return {
                        // オリジナルの解説ではリトルエンディアンで処理しているが、
                        // ビッグエンディアンで処理したいので、左に追加している
                        lastBit: (bitForNext << lastLen) | lastBit, // n個の1
                        lastLen: bitForNextLen + lastLen, // n+1
                        dataView,
                        pos,
                    }
                }

                // 前回の残りと新規分とを合わせ、8bit分のデータを用意する
                const n1 = 8 - lastLen
                const oct = (((1 << n1) - 1) << lastLen) | lastBit

                // 8bitをバッファに書き込み
                let curPos = pos
                dataView.setUint8(curPos, oct)
                curPos++

                // 残りのbitが8個より多いなら、8bit分の1を書いてしまう
                let bitLen = n - n1
                if (bitLen > 8) {
                    dataView.setUint8(curPos, 255)
                    curPos++
                    bitLen -= 8
                }

                // バックギャモンの駒は1プレイヤー15個なので、bitLen < 8が保証される
                return {
                    lastBit: (1 << bitLen) - 1, // n個の1
                    lastLen: bitLen + 1, // n+1
                    dataView,
                    pos: curPos,
                }
            },
            { lastBit: 0, lastLen: 0, dataView: new DataView(buffer), pos: 0 }
        )

    // バッファーがオーバーフローしているなら、エラーを返す
    // （最後のバイトはまだ書かれていない）
    if (v.pos >= 10) {
        return { isValid: false }
    }

    // 最後に残ったデータは、そのまま1バイトとして扱う
    v.dataView.setUint8(v.pos, v.lastBit)

    // 一応、バッファの空きも詰める
    let pos = v.pos + 1
    while (pos < 10) {
        v.dataView.setUint8(pos, 0)
        pos++
    }

    return {
        isValid: true,
        positionID: encodeBase64(buffer).substring(0, 14),
    }
}

export function decode() {
    //
}

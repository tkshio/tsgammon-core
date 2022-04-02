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

                // n個のコマに対して、n個の1を書く
                let bitLen = n

                let curLen = lastLen
                let curPos = pos
                let curBit = lastBit
                let hasCleared = false

                // 前回の残りと、新規追加の分を8bitずつdataViewに書き込む
                while (bitLen + curLen >= 8) {
                    const n1 = 8 - curLen

                    // n1個の1（0->0, 1->1, 2->11, 3->111, 4->1111...）を用意して、
                    // curBitの左側に追加する（二周目からは実質bitTosetのまま）
                    // ドキュメントではリトルエンディアンで処理しているが、
                    // ここでは最初からビッグエンディアンになるようにbit列を構成している
                    const bitToSet = (1 << n1) - 1

                    // TODO: というか2回目以降はループで回す必要がない
                    // (n / 8の分だけ、255を書き込めばよいから)
                    // 駒の数も15個までなので、ループはせいぜい2回だ
                    const oct = (bitToSet << curLen) | curBit

                    // 8bitをバッファに書き込み
                    dataView.setUint8(curPos, oct)
                    curPos++

                    bitLen = bitLen - n1
                    // ループの2回目以降は、残りのbitLenから8bitずつ書いていく
                    curLen = 0
                    curBit = 0
                    // 前回の残りは8bitまたはそれ以下なので、一旦ループに入れば書き切れる
                    hasCleared = true
                }

                // バッファに書かなかった分を次に引き継ぐため、1のbit列に変換する
                const bitForNext = (1 << bitLen) - 1

                // 先頭には0をつけるので、長さは上記のbit列より1bit長くなる
                //     この先頭の0は、必ず次回のループ初回で書き込まれるか、
                //     ループをスルーしてその次へ引き継がれるかのいずれか
                const bitForNextLen = bitLen + 1

                const { nextBit, nextLen } = hasCleared
                    ? // ループに入ったなら、前回からの引き継ぎはもはや気にしなくて良い
                      { nextBit: bitForNext, nextLen: bitForNextLen }
                    : // ループに入っていないなら、前回からの引き継ぎに追加する
                      {
                          nextBit: (bitForNext << lastLen) | lastBit,
                          nextLen: bitForNextLen + lastLen,
                      }

                return {
                    lastBit: nextBit, // n個の1
                    lastLen: nextLen, // n+1
                    dataView,
                    pos: curPos,
                }
            },
            { lastBit: 0, lastLen: 0, dataView: new DataView(buffer), pos: 0 }
        )

    // バッファーがオーバーフローしているなら、エラーを返す
    // （最後のバイトはまだ書かれていないことに注意）
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

    // TODO: Bufferを使うとブラウザで使えないので、修正が必要
    const arr: Uint8Array = new Uint8Array(buffer)
    return {
        isValid: true,
        positionID: Buffer.from(arr).toString('base64').substring(0, 14),
    }
}

export function decode() {
    //
}

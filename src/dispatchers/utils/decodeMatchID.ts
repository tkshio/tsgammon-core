import { decode as decodeBase64 } from '@borderless/base64'

export function decodeMatchID(matchID: string) {
    const decoded = new Uint8Array(decodeBase64(matchID.substring(0, 14)))
    const cube = decoded[0] & 15
    const cubeOwner = (decoded[0] >> 4) & 3
    const diceOwner = (decoded[0] >> 6) & 1
    const crawford = (decoded[0] >> 7) & 1

    const gameState = decoded[1] & 7
    const turnOwner = (decoded[1] >> 3) & 1
    const double = (decoded[1] >> 4) & 1
    const resign = (decoded[1] >> 5) & 3
    const dice1 = ((decoded[2] & 3) << 1) | ((decoded[1] >> 7) & 1)
    const dice2 = (decoded[2] >> 2) & 7
    const matchLen =
        ((decoded[4] & 15) << 11) |
        ((decoded[3] & 255) << 3) |
        ((decoded[2] >> 5) & 7)

    const score1 =
        ((decoded[6] & 7) << 12) |
        ((decoded[5] & 255) << 4) |
        ((decoded[4] >> 4) & 15)

    const score2 =
        ((decoded[8] & 3) << 13) |
        ((decoded[7] & 255) << 5) |
        ((decoded[6] >> 3) & 31)

    return {
        cube,
        cubeOwner,
        diceOwner,
        crawford,
        gameState,
        turnOwner,
        double,
        resign,
        dice1,
        dice2,
        matchLen,
        score1,
        score2,
    }
}

import { Ply } from '../../Ply'
import { SGResult } from '../../records/SGResult'
import { defaultNames } from '../../records/utils/defaultNames'
import { MoveFormatDirection } from '../../utils/formatAbsMove'
import { formatPly, formatPlyAbbr } from '../../utils/formatPly'
import { CheckerPlayState } from '../CheckerPlayState'
import { CBState } from '../CubeGameState'
import { SGState } from '../SingleGameState'

/**
 * 現局面を単純な文字列で表記する
 *
 * @param sgState
 * @param cbState
 * @param cpState
 * @param moveFormatDirection
 * @param red
 * @param white
 * @returns
 */
export function formatState(
    sgState: SGState,
    cbState?: CBState,
    cpState?: CheckerPlayState,
    moveFormatDirection?: MoveFormatDirection,
    red: string = defaultNames.red,
    white: string = defaultNames.white
) {
    if (cbState && cbState.tag !== 'CBInPlay') {
        switch (cbState.tag) {
            case 'CBOpening':
                return 'Opening roll.'

            case 'CBResponse':
                return `${cbState.isDoubleFromRed ? red : white} offers double.`

            case 'CBAction': {
                const lastPly =
                    sgState.tag === 'SGToRoll' ? sgState.lastPly : undefined
                return formatToRoll(
                    cbState.isRed,
                    lastPly,
                    moveFormatDirection,
                    red,
                    white
                )
            }
            case 'CBToRoll': {
                const lastPly =
                    sgState.tag === 'SGToRoll' ? sgState.lastPly : undefined
                return cbState.lastAction === 'Take'
                    ? `${cbState.isRed ? white : red} accepts the cube.`
                    : formatToRoll(
                          cbState.isRed,
                          lastPly,
                          moveFormatDirection,
                          red,
                          white
                      )
            }
            case 'CBEoG': {
                return `${
                    cbState.result === SGResult.REDWON
                        ? `${red} win.`
                        : cbState.result === SGResult.WHITEWON
                        ? `${white} win.`
                        : ''
                }`
            }
        }
    }

    return formatSGState(sgState, cpState, moveFormatDirection, red, white)
}

function formatToRoll(
    isRed: boolean,
    lastPly?: Ply,
    moveFormatDirection?: MoveFormatDirection,
    red: string = defaultNames.red,
    white: string = defaultNames.white
) {
    return (
        `${isRed ? red : white} to roll.` +
        (lastPly
            ? ` ( last play ${formatPlyAbbr(lastPly, moveFormatDirection)} )`
            : '')
    )
}

function formatSGState(
    sgState: SGState,
    cpState?: CheckerPlayState,
    moveFormatDirection?: MoveFormatDirection,
    red: string = defaultNames.red,
    white: string = defaultNames.white
) {
    // 移動中
    if (cpState) {
        return formatPly(cpState.curPly)
    }
    switch (sgState.tag) {
        case 'SGOpening':
            return 'Opening roll.'
        case 'SGToRoll':
            return formatToRoll(
                sgState.isRed,
                sgState.lastPly,
                moveFormatDirection,
                red,
                white
            )
        case 'SGInPlay': {
            return formatPly(sgState.curPly)
        }
        case 'SGEoG': {
            return sgState.result === SGResult.NOGAME
                ? 'No game'
                : `${sgState.result === SGResult.REDWON ? red : white} wins ${
                      sgState.stake.value
                  }pt.`
        }
    }
}

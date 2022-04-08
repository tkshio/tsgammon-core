import { Cube } from '../../Cube'
import { DiceRoll } from '../../Dices'
import { standardConf } from '../../GameConf'
import { COLOUR, DIRECTION, TURN } from '../../utils/FIBSBoard'

type TestData = {
    title: string
    pos: number[]
    fibs: string
    myBearOff?: number
    oppBearOff?: number
    colour?: COLOUR
    direction?: DIRECTION
    turn?: TURN
    cube?: Cube
}

type TestDataWithRoll = TestData & {
    roll: DiceRoll
}

type TestDataAfterMove = TestDataWithRoll & {
    moves: { from: number }[]
}

// prettier-ignore
const ordinal_pos = [
     0,
     1, 0, 0, 0, 0, -5,   1, -3, 0, 0, 0,  4,
    -5, 1, 0, 0, 3,  0,   5,  0, 0, 0, 0, -2, 
     0,
]

// prettier-ignore
const onthebar_pos = [
        3,
      -12, 0, 0, 0, 0, 0,   0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,   0, 0, 0, 0, 5, 7, 
       -2,
]

// prettier-ignore
const bearoff_pos = [
     0,
    -3, 0, 0, 0, 0, 0,   0, 0, 0, 0, 0,  0,
     0, 0, 0, 0, 0, 0,   0, 0, 0, 0, 0, 10,
     0,
]

export const testData: TestData[] = [
    {
        title: 'opening',
        pos: standardConf.initialPos,
        fibs:
            'board:You:opponent:' + // players
            '9999:' + // matchlength
            '0:0:' + // player's score : opponent's score
            '0:2:0:0:0:0:-5:0:-3:0:0:0:5:-5:0:0:0:3:0:5:0:0:0:0:-2:0:' + // position
            '-1:' + // -1:X's turn, 1:O's turn, 0: game is over
            '0:0:0:0:' + // player's dice rolls: opponents dice rolls
            // ( 0 if it is not the person's turn, the person haven't rolled yet )
            '1:' + // cube value
            '1:1:' + // 1: may double, 0: not allowed to double(player:opponent:)
            '0:' + // was doubled('not useful anyway' says official doc, so always 0 )
            '-1:' + // colour: -1: you are X, 1: you are O
            '-1:' + // direction -1: you play 24->1(DESC), 1: you play 1->24(ASC)
            '0:25:' + // Home and bar (0:25: for DESC, 25:0 for direction ASC)
            '0:0:' + // on home
            '0:0:' + // on bar
            '0:' + // num of pieces you can move
            // (0-4, valid if it's your turn and already have rolled)
            '0:0:' + // (forced move and did crawford) do not use
            '0', // maximum number of instant redoubles in unlimited matches
    },
    {
        title: 'ordinal pos',
        pos: ordinal_pos,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '0:2:0:0:0:0:-5:0:-3:0:0:-1:5:' + // DESC
            '-4:0:0:0:3:-1:5:0:0:0:0:-1:0:' + //
            '-1:' + // X's turn
            '0:0:0:0:1:1:1:0:' + //
            '-1:-1:' + // default setting is X, DESC
            '0:25:0:0:0:0:0:0:0:0',
    },
    {
        title: 'ordinal pos with conf',
        pos: ordinal_pos,
        colour: COLOUR.O,
        direction: DIRECTION.ASC,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '0:1:0:0:0:0:-5:1:-3:0:0:0:4:' + // ASC
            '-5:1:0:0:3:0:5:0:0:0:0:-2:0:' + //
            '1:' + // O's turn
            '0:0:0:0:1:1:1:0:' + //
            '1:1:' + // O, ASC
            '25:0:0:0:0:0:0:0:0:0',
    },
    {
        title: 'ordinal pos with conf COLOUR=O',
        pos: ordinal_pos,
        colour: COLOUR.O,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '0:-2:0:0:0:0:5:0:3:0:0:1:-5:' + // DESC
            '4:0:0:0:-3:1:-5:0:0:0:0:1:0:' + //
            '1:' + // O's turn
            '0:0:0:0:1:1:1:0:' + //
            '1:-1:' + // O, DESC
            '0:25:0:0:0:0:0:0:0:0',
    },
    {
        title: 'ordinal pos with conf TURN=X (COLOUR=O)',
        pos: ordinal_pos,
        colour: COLOUR.O,
        turn: TURN.X,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '0:-2:0:0:0:0:5:0:3:0:0:1:-5:' + // DESC
            '4:0:0:0:-3:1:-5:0:0:0:0:1:0:' + //
            '-1:' + // X's turn
            '0:0:0:0:1:1:1:0:' + //
            '1:-1:' + // O, DESC
            '0:25:0:0:0:0:0:0:0:0',
    },
    {
        title: 'ordinal pos with conf TURN=O (COLOUR=X)',
        pos: ordinal_pos,
        turn: TURN.O,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '0:2:0:0:0:0:-5:0:-3:0:0:-1:5:' + // DESC
            '-4:0:0:0:3:-1:5:0:0:0:0:-1:0:' + //
            '1:' + // O's turn
            '0:0:0:0:1:1:1:0:' + //
            '-1:-1:' + // X, DESC
            '0:25:0:0:0:0:0:0:0:0',
    },
    {
        title: 'on-the-bar pos',
        pos: onthebar_pos,
        colour: COLOUR.O,
        direction: DIRECTION.ASC,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '3:-12:0:0:0:0:0:0:0:0:0:0:0:' + // ASC
            '0:0:0:0:0:0:0:0:0:0:5:7:-2:' + //
            '1:' + // O's turn
            '0:0:0:0:1:1:1:0:' + //
            '1:1:' + // O, ASC
            '25:0:' + //
            '0:0:' + // on home
            '3:2:' + // on bar
            '0:0:0:0',
    },
    {
        title: 'on-the-bar pos(player=X)',
        pos: onthebar_pos,
        colour: COLOUR.X,
        direction: DIRECTION.ASC,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '-3:12:0:0:0:0:0:0:0:0:0:0:0:' + // ASC
            '0:0:0:0:0:0:0:0:0:0:-5:-7:2:' + //
            '-1:' + // X's turn
            '0:0:0:0:1:1:1:0:' + //
            '-1:1:' + // X, ASC
            '25:0:' + //
            '0:0:' + // on home
            '3:2:' + // on bar
            '0:0:0:0',
    },
    {
        title: 'on-the-bar pos(player=X,DESC)',
        pos: onthebar_pos,
        colour: COLOUR.X,
        direction: DIRECTION.DESC,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '2:-7:-5:0:0:0:0:0:0:0:0:0:0:' + // DESC
            '0:0:0:0:0:0:0:0:0:0:0:12:-3:' + //
            '-1:' + // X's turn
            '0:0:0:0:1:1:1:0:' + //
            '-1:-1:' + // X, DESC
            '0:25:0:0:' +
            '3:2:' + // on bar
            '0:0:0:0',
    },
    {
        title: 'bear-off pos',
        pos: bearoff_pos,
        colour: COLOUR.O,
        direction: DIRECTION.ASC,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '0:-3:0:0:0:0:0:0:0:0:0:0:0:' + // ASC
            '0:0:0:0:0:0:0:0:0:0:0:10:0:' + //
            '1:' + // O's turn
            '0:0:0:0:1:1:1:0:' + //
            '1:1:' + // O, ASC
            '25:0:' + //
            '5:12:' + // on home
            '0:0:0:0:0:0',
        myBearOff: 5,
        oppBearOff: 12,
    },
    {
        title: 'eog',
        pos: bearoff_pos,
        turn: TURN.OVER,
        colour: COLOUR.O,
        direction: DIRECTION.ASC,
        fibs:
            'board:You:opponent:9999:0:0:' + //
            '0:-3:0:0:0:0:0:0:0:0:0:0:0:' + // ASC
            '0:0:0:0:0:0:0:0:0:0:0:10:0:' + //
            '0:' + // End of game
            '0:0:0:0:1:1:1:0:' + //
            '1:1:' + // O, ASC
            '25:0:' + //
            '5:12:' + // on home
            '0:0:0:0:0:0',
        myBearOff: 5,
        oppBearOff: 12,
    },
    {
        title: 'opening pos with cube(player owns cube)',
        pos: standardConf.initialPos,
        cube: { cubeValue: 2, playerMayDouble: true, opponentMayDouble: false },
        fibs:
            'board:You:opponent:9999:0:0:' +
            '0:2:0:0:0:0:-5:0:-3:0:0:0:5:-5:0:0:0:3:0:5:0:0:0:0:-2:0:' + // position
            '-1:0:0:0:0:' +
            '2:' + // cube value
            '1:0:' + // 1: may double, 0: not allowed to double(player:opponent:)
            '0:-1:-1:0:25:0:0:0:0:0:0:0:0',
    },
    {
        title: 'opening pos with cube(opponent owns cube)',
        pos: standardConf.initialPos,
        cube: { cubeValue: 4, playerMayDouble: false, opponentMayDouble: true },
        fibs:
            'board:You:opponent:9999:0:0:' +
            '0:2:0:0:0:0:-5:0:-3:0:0:0:5:-5:0:0:0:3:0:5:0:0:0:0:-2:0:' + // position
            '-1:0:0:0:0:' +
            '4:' + // cube value
            '0:1:' + // 1: may double, 0: not allowed to double(player:opponent:)
            '0:-1:-1:0:25:0:0:0:0:0:0:0:0',
    },
    {
        title: 'opening pos with cube(nobody may double)',
        pos: standardConf.initialPos,
        cube: {
            cubeValue: 8,
            playerMayDouble: false,
            opponentMayDouble: false,
        },
        fibs:
            'board:You:opponent:9999:0:0:' +
            '0:2:0:0:0:0:-5:0:-3:0:0:0:5:-5:0:0:0:3:0:5:0:0:0:0:-2:0:' + // position
            '-1:0:0:0:0:' +
            '8:' + // cube value
            '0:0:' + // 1: may double, 0: not allowed to double(player:opponent:)
            '0:-1:-1:0:25:0:0:0:0:0:0:0:0',
    },
]

export const testDataWithRoll: TestDataWithRoll[] = [
    {
        title: 'opening with 3-1',
        pos: standardConf.initialPos,
        roll: { dice1: 3, dice2: 1 },
        fibs:
            'board:You:opponent:9999:0:0:' +
            '0:2:0:0:0:0:-5:0:-3:0:0:0:5:-5:0:0:0:3:0:5:0:0:0:0:-2:0:' + // position
            '-1:' +
            '3:1:0:0:' + // player's dice rolls: opponents dice rolls
            '1:1:1:0:' +
            '-1:-1:0:25:0:0:0:0:' +
            '2:' + // num of pieces you can move
            '0:0:0',
    },
    {
        title: 'opening with 1-3',
        pos: standardConf.initialPos,
        turn: TURN.O,
        roll: { dice1: 1, dice2: 3 },
        fibs:
            'board:You:opponent:9999:0:0:' +
            '0:2:0:0:0:0:-5:0:-3:0:0:0:5:-5:0:0:0:3:0:5:0:0:0:0:-2:0:' + // position
            '1:' +
            '0:0:1:3:' + // player's dice rolls: opponents dice rolls
            '1:1:1:0:-1:-1:0:25:0:0:0:0:' +
            '2:' + // num of pieces you can move
            '0:0:0',
    },
    {
        title: 'opening pos with 3-3',
        pos: standardConf.initialPos,
        roll: { dice1: 3, dice2: 3 },
        fibs:
            'board:You:opponent:9999:0:0:' +
            '0:2:0:0:0:0:-5:0:-3:0:0:0:5:-5:0:0:0:3:0:5:0:0:0:0:-2:0:' + // position
            '-1:' + //
            '3:3:0:0:' + // player's dice rolls: opponents dice rolls
            '1:1:1:0:-1:-1:0:25:0:0:0:0:' +
            '4:' + // num of pieces you can move
            '0:0:0',
    },
    {
        title: 'forced pos (no move)',
        // prettier-ignore
        pos: [
             1,
            -2, -2, -2, -2, -2, -2,   0, 0, 0, 0, 0, 0,
             0,  0,  0,  0,  0,  0,   0, 0, 0, 0, 0, 0,
             0
        ],
        roll: { dice1: 1, dice2: 3 },
        colour: COLOUR.O,
        direction: DIRECTION.ASC,
        fibs:
            'board:You:opponent:9999:0:0:' +
            '1:-2:-2:-2:-2:-2:-2:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:' + // position
            '1:' +
            '1:3:0:0:' + // player's dice rolls: opponents dice rolls
            '1:1:1:0:1:1:25:0:0:0:1:0:' +
            '0:' + // num of pieces you can move
            '0:0:0',
    },
    {
        title: 'forced pos (must use larger one)',
        // prettier-ignore
        pos: [
            1,
            0, -2,  0, -2, -2, -2,   0, 0, 0, 0, 0, 0,
            0,  0,  0,  0,  0,  0,   0, 0, 0, 0, 0, 0,
            0
       ],
        roll: { dice1: 1, dice2: 3 },
        colour: COLOUR.O,
        direction: DIRECTION.ASC,
        fibs:
            'board:You:opponent:9999:0:0:' +
            '1:0:-2:0:-2:-2:-2:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:0:' + // position
            '1:' +
            '3:1:0:0:' + // player's dice rolls: opponents dice rolls
            '1:1:1:0:1:1:25:0:0:0:1:0:' +
            '1:' + // num of pieces you can move
            '0:0:0',
    },
]

export const testDataAfterMove: TestDataAfterMove[] = [
    {
        title: 'opening with 3-1',
        pos: standardConf.initialPos,
        roll: { dice1: 3, dice2: 1 },
        colour: COLOUR.O,
        direction: DIRECTION.ASC,
        fibs:
            'board:You:opponent:9999:0:0:' +
            '0:2:0:0:0:0:-5:0:-3:0:0:0:5:-5:0:0:0:2:0:5:1:0:0:0:-2:0:' + // position
            '1:' +
            '1:0:0:0:' + // player's dice rolls: opponents dice rolls
            '1:1:1:0:' +
            '1:1:25:0:0:0:0:0:' +
            '1:' + // num of pieces you can move
            '0:0:0',
        moves: [{ from: 17 }],
    },
]

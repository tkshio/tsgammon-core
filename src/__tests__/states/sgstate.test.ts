import { boardState } from '../../BoardState'
import { BoardStateNode } from '../../BoardStateNode'
import { diceRoll } from '../../Dices'
import { standardConf } from '../../GameConfs'
import { standardRuleSet } from '../../rules/standardRuleSet'
import { sgTransition } from '../../states/SGTransitions'
import {
    inPlayStateWithNode,
    openingState,
    SGInPlay,
    SGOpening,
} from '../../states/SingleGameState'

describe('SGState', () => {
    const board = boardState(standardConf.initialPos)
    const sg = sgTransition(standardRuleSet)
    const state = openingState(board)

    test('usually start with SGOpening', () => {
        expect(state.tag).toEqual('SGOpening')
        expect(state.diceRoll).toBeUndefined()
    })
    const roll = diceRoll(3, 3)
    const stateReroll = sg.doOpening(state, roll)
    test('is still SGOpening after re-roll', () => {
        expect(stateReroll.tag).toEqual('SGOpening')
        expect((stateReroll as SGOpening).diceRoll).toEqual(roll)
    })

    const rollRedFirst = diceRoll(3, 1)
    const stateInPlay = sg.doOpening(stateReroll as SGOpening, rollRedFirst)
    test('transits to SGInPlay after opening roll', () => {
        expect(stateInPlay.tag).toEqual('SGInPlay')
    })
    const node1 = (stateInPlay as SGInPlay).boardStateNode.childNode(1)
    if (!node1.hasValue) {
        throw new Error()
    }
    const node2 = node1.childNode(4)
    const stateInPlayToCommit = inPlayStateWithNode(
        stateInPlay as SGInPlay,
        node2 as BoardStateNode
    )
    const stateToRoll = sg.doCheckerPlayCommit(stateInPlayToCommit)
    test('transits to SGToRoll after commit', () => {
        expect(stateInPlayToCommit.tag).toEqual('SGInPlay')
        expect(stateInPlayToCommit.curPly.moves.length).toBe(2) // must keep last moves
        expect(stateToRoll.tag).toEqual('SGToRoll')
    })
})

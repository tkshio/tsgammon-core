import { boardStateNodeFromArray, wrap } from '../BoardStateNode'
import { standardConf } from '../GameConf'

const nodeWithValue = boardStateNodeFromArray(standardConf.initialPos, 1, 2)
const nodeNoValue = nodeWithValue.majorFirst(2)

describe('Wrapper.apply', () => {
    test('applies func if node.hasValue()', () => {
        const node = boardStateNodeFromArray(standardConf.initialPos, 1, 2)
        const wrapped = wrap(node)
        expect(wrapped.apply((node) => node).unwrap.hasValue).toBeTruthy()
    })

    test('ignores node if !node.hasValue()', () => {
        const wrapped = wrap(nodeNoValue)
        expect(
            wrapped.apply(
                () => nodeWithValue // function returns node with node.hasValue()==true
            ).unwrap.hasValue
            // wrapped node has no value, so apply() won't use the function
        ).toBeFalsy()
    })
})

describe('Wrapper.or', () => {
    test("doesn't apply the func if node.hasValue()", () => {
        const wrapped = wrap(nodeWithValue)
        // wrapped node has already value, so function or() won't use the function
        expect(wrapped.or(() => nodeNoValue).unwrap.hasValue).toBeTruthy()
    })

    test('applies the func node if !node.hasValue()', () => {
        const nodeNoValue = boardStateNodeFromArray(
            standardConf.initialPos,
            1,
            2
        ).majorFirst(2)
        const wrapped = wrap(nodeNoValue)
        expect(wrapped.or(() => nodeWithValue).unwrap.hasValue).toBeFalsy()
    })
    test('can be used after or() / first or() failed', () => {
        const nodeNoValue = boardStateNodeFromArray(
            standardConf.initialPos,
            1,
            2
        ).majorFirst(2)
        const wrapped = wrap(nodeWithValue)
        expect(
            wrapped.or(() => nodeNoValue).or(() => nodeWithValue).unwrap
                .hasValue
        ).toBeTruthy()
    })
    test('can be used after or() / first or() found a value', () => {
        const nodeNoValue = boardStateNodeFromArray(
            standardConf.initialPos,
            1,
            2
        ).majorFirst(2)
        const wrapped = wrap(nodeWithValue)
        expect(
            wrapped.or(() => nodeWithValue).or(() => nodeNoValue).unwrap
                .hasValue
        ).toBeTruthy()
    })
})

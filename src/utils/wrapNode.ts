import { BoardStateNode } from '../BoardStateNode'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'
import { wrap, Wrapped } from './wrap'

export function wrapNode(
    node: BoardStateNode | BoardStateNodeRoot,
    minorFirst = false
) {
    return node.isRoot ? wrapRootNode(node, minorFirst) : wrap(node)
}

export function wrapRootNode(
    root: BoardStateNodeRoot,
    minorFirst: boolean
): Wrapped<BoardStateNode> {
    return _wrapRootNode(root, { hasValue: false }, minorFirst)
}

function _wrapRootNode(
    root: BoardStateNodeRoot | { hasValue: false },
    was: BoardStateNodeRoot | { hasValue: false },
    minorFirst: boolean
): Wrapped<BoardStateNode> {
    function swapForMinorFirst(root: BoardStateNodeRoot, swapFirst: boolean) {
        return swapFirst && root.swapped
            ? { primary: root.swapped, secondary: root.root }
            : { primary: root.root, secondary: root.swapped }
    }
    const wrapped: Wrapped<BoardStateNode> = {
        apply: (
            f: (a: BoardStateNode) => BoardStateNode | { hasValue: false }
        ): Wrapped<BoardStateNode> => {
            if (root.hasValue) {
                const { primary, secondary } = swapForMinorFirst(
                    root,
                    minorFirst
                )
                const result = f(primary)
                if (result.hasValue) {
                    return wrap(result)
                }
                if (secondary) {
                    const result = f(secondary)
                    return wrap(result)
                }
            }
            return _wrapRootNode({ hasValue: false }, root, minorFirst) // or()に渡される // TODO: or()内のswapFirstの先取りをしてもいいかも
        },
        or: (
            f: (a: BoardStateNode) => BoardStateNode | { hasValue: false }
        ): Wrapped<BoardStateNode> => {
            if (!root.hasValue && was.hasValue) {
                const { primary, secondary } = swapForMinorFirst(
                    was,
                    minorFirst
                )
                const result = f(primary)
                if (result.hasValue) {
                    return wrap(result)
                }
                if (secondary) {
                    const result = f(secondary)
                    return wrap(result)
                }
            }
            // rootがapply()で成功している(のでor()は何もしない)か、
            // 適用した関数が失敗しているので、与引数をそのまま次に渡す
            return _wrapRootNode({ hasValue: false }, was, minorFirst)
        },
        unwrap: root.hasValue ? root.root : { hasValue: false },
    }
    return wrapped
}

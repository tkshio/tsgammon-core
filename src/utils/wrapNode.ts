import { BoardStateNode } from '../BoardStateNode'
import { BoardStateNodeRoot } from '../BoardStateNodeRoot'
import { wrap, Wrapped } from './wrap'

export function wrapNode(
    node: BoardStateNode | BoardStateNodeRoot,
    selectAlternate = false
) {
    return node.isRoot ? wrapRootNode(node, selectAlternate) : wrap(node)
}

export function wrapRootNode(
    root: BoardStateNodeRoot,
    selectAlternate: boolean
): Wrapped<BoardStateNode> {
    return _wrapRootNode(root, { hasValue: false }, selectAlternate)
}

function _wrapRootNode(
    root: BoardStateNodeRoot | { hasValue: false },
    was: BoardStateNodeRoot | { hasValue: false },
    selectAlternate: boolean
): Wrapped<BoardStateNode> {
    function swapForAlternate(
        root: BoardStateNodeRoot,
        selectAlternate: boolean
    ) {
        return selectAlternate && root.alternate
            ? { primary: root.alternate, secondary: root.primary }
            : { primary: root.primary, secondary: root.alternate }
    }
    const wrapped: Wrapped<BoardStateNode> = {
        apply: (
            f: (a: BoardStateNode) => BoardStateNode | { hasValue: false }
        ): Wrapped<BoardStateNode> => {
            if (root.hasValue) {
                const { primary, secondary } = swapForAlternate(
                    root,
                    selectAlternate
                )
                const result = f(primary)
                if (result.hasValue) {
                    return wrap(result)
                }
                if (secondary) {
                    const result = f(secondary)
                    if (result.hasValue) {
                        return wrap(result)
                    }
                }
            }
            return _wrapRootNode({ hasValue: false }, root, selectAlternate) // or()に渡される // TODO: or()内のswapFirstの先取りをしてもいいかも
        },
        or: (
            f: (a: BoardStateNode) => BoardStateNode | { hasValue: false }
        ): Wrapped<BoardStateNode> => {
            if (!root.hasValue && was.hasValue) {
                const { primary, secondary } = swapForAlternate(
                    was,
                    selectAlternate
                )
                const result = f(primary)
                if (result.hasValue) {
                    return wrap(result)
                }
                if (secondary) {
                    const result = f(secondary)
                    if (result.hasValue) {
                        return wrap(result)
                    }
                }
            }
            // rootがapply()で成功している(のでor()は何もしない)か、
            // 適用した関数が失敗しているので、与引数をそのまま次に渡す
            return _wrapRootNode({ hasValue: false }, was, selectAlternate)
        },
        unwrap: root.hasValue ? root.primary : { hasValue: false },
    }
    return wrapped
}

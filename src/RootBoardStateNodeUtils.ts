import { BoardStateNode, wrap, Wrapped } from './BoardStateNode'
import { RootBoardStateNode } from './RootBoardStateNode'
import { makePoint } from './utils/makePoint'

export function makePointRootNode(rootNode: RootBoardStateNode, pos: number) {
    return wrapRootNode(rootNode, false).apply((node) => makePoint(node, pos))
        .unwrap
}

export function wrapRootNode(
    root: RootBoardStateNode,
    swapFirst: boolean
): Wrapped<BoardStateNode> {
    return _wrapRootNode(root, { hasValue: false }, swapFirst)
}
export function _wrapRootNode(
    root: RootBoardStateNode | { hasValue: false },
    was: RootBoardStateNode | { hasValue: false },
    swapFirst: boolean
): Wrapped<BoardStateNode> {
    function applySwapFirst(root: RootBoardStateNode, swapFirst: boolean) {
        return swapFirst && root.swapped
            ? { primary: root.swapped, secondary: root.root }
            : { primary: root.root, secondary: root.swapped }
    }
    const wrapped: Wrapped<BoardStateNode> = {
        apply: (
            f: (a: BoardStateNode) => BoardStateNode | { hasValue: false }
        ): Wrapped<BoardStateNode> => {
            if (root.hasValue) {
                const { primary, secondary } = applySwapFirst(root, swapFirst)
                const result = f(primary)
                if (result.hasValue) {
                    return wrap(result)
                }
                if (secondary) {
                    const result = f(secondary)
                    return wrap(result)
                }
            }
            return _wrapRootNode({ hasValue: false }, root, swapFirst) // or()に渡される // TODO: or()内のswapFirstの先取りをしてもいいかも
        },
        or: (
            f: (a: BoardStateNode) => BoardStateNode | { hasValue: false }
        ): Wrapped<BoardStateNode> => {
            if (!root.hasValue && was.hasValue) {
                const { primary, secondary } = applySwapFirst(was, swapFirst)
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
            return _wrapRootNode({ hasValue: false }, was, swapFirst)
        },
        unwrap: root.hasValue ? root.root : { hasValue: false },
    }
    return wrapped
}

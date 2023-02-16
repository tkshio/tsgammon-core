// 局面ツリー構築用の型

export type NodeBuilders<NODE, TMP_NODE, CHILDREN> = {
    /**
     * 与えられた仮ノードが末端の局面なら、末端ノードを生成して返す
     * @param node 仮ノード
     * @returns nodeが末端なら生成した末端ノード、そうでなければ{hasValue:false}
     */
    ifLeafThenBuild: (node: TMP_NODE) => HasValueOrNot<NODE>
    /**
     * 与えられた仮ノードと子ノードの集合から、枝ノードを生成する
     * @param node 仮ノード
     * @param childNodes buildChildNodes()によって生成された、nodeの子ノード
     * @returns childNodesを子ノードにもつ枝ノード
     */
    buildBranchNode: (node: TMP_NODE, childNodes: CHILDREN) => NODE
    /**
     * 与えられた仮ノードに対し、recurse()関数を使って、子ノードの集合を生成する
     * @param parent 仮ノード
     * @param recurse 子ノードとなる仮ノードから、子ノードを生成する関数
     * @returns parent(から生成される枝ノード)の子ノードの集合
     */
    buildChildNodes: (
        parent: TMP_NODE,
        recurse: (tmpChild: TMP_NODE) => NODE
    ) => CHILDREN
}

export type HasValueOrNot<T> =
    | {
          hasValue: true
          value: T
      }
    | { hasValue: false; value?: never }

export function buildRecursiveNodeBuilder<N, T, C>(
    nodeBuilders: NodeBuilders<N, T, C>
): (tmpNode: T) => N {
    const recursiveNodeBuilder = (tmpNode: T): N => {
        const node = nodeBuilders.ifLeafThenBuild(tmpNode)
        if (node.hasValue) {
            // 局面が末端(ダイスを使い切った、またはEoG)なら、生成された末端ノードを返す
            return node.value
        } else {
            // それ以外なら、一手進めた局面のノードのリストを生成し、中間ノードを生成する
            const children = nodeBuilders.buildChildNodes(
                tmpNode,
                recursiveNodeBuilder
            )
            return nodeBuilders.buildBranchNode(tmpNode, children)
        }
    }
    return recursiveNodeBuilder
}

// 局面ツリー構築用の型

export type NodeBuilders<NODE, TMP_NODE, CHILDREN> = {
    ifLeafThenBuild: (node: TMP_NODE) => HasValueOrNot<NODE>
    buildBranchNode: (node: TMP_NODE, childNodes: CHILDREN) => NODE
    buildChildNodes(
        parent: TMP_NODE,
        recurse: (parent: TMP_NODE) => NODE
    ): CHILDREN
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

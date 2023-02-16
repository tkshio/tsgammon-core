/**
 * BoardStateNodeが保持する、適用可能な手を表したツリーに対して、
 * 任意のノードを選択する関数を順次受け付けるためのラッパー
 */
export type Wrapped<T extends { hasValue: boolean }> = {
    /**
     * wrap()に渡した値、または直前のapply()/or()がhasValue=trueを満たすなら、指定された関数fを適用する。
     */
    apply: (f: (a: T) => T | { hasValue: false }) => Wrapped<T>
    /**
     * wrap()に渡した値、または直前のapply()/or()がhasValue=falseの場合のみ、指定された関数fを適用する
     */
    or: (f: (a: T) => T | { hasValue: false }) => Wrapped<T>
    /**
     * 現時点で選択されたノード（または該当なし）を返す
     */
    unwrap: T | { hasValue: false }
}

/**
 * 指定されたノードをWrapperに変換する
 * @param t Wrapperにしたいノード
 * @returns
 */
export function wrap<T extends { hasValue: true }>(
    t: T | { hasValue: false }
): Wrapped<T> {
    return _wrap(t, { hasValue: false })
}

function _wrap<T extends { hasValue: true }>(
    t: T | { hasValue: false }, // 直前のor/applyで引数の関数で見つかったノード
    was: T | { hasValue: false } // or/applyの関数に、引数として渡されたノード
): Wrapped<T> {
    return {
        apply: (f: (arg: T) => T | { hasValue: false }) =>
            _wrap(t.hasValue ? f(t) : t, t),
        or: (f: (arg: T) => T | { hasValue: false }) =>
            _wrap(t.hasValue ? t : was.hasValue ? f(was) : was, was),
        unwrap: t,
    }
}

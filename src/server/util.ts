/** Utilitários internos do servidor. */

/** Um `T` com `undefined` removido dos valores — o que sobra depois de `stripUndefined`. */
type Defined<T> = { [K in keyof T]: Exclude<T[K], undefined> };

/**
 * Remove as chaves com valor `undefined` de um objeto.
 *
 * Usado ao aplicar patches parciais e ao mesclar rascunhos: como `undefined`
 * significa "não informado", precisa sumir antes de qualquer merge — senão
 * sobrescreve o valor existente.
 */
export function stripUndefined<T extends object>(value: T | undefined): Partial<Defined<T>> {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<Defined<T>>;
}

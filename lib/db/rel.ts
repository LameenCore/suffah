// PostgREST embedded-relation unwrapping.
//
// A `.select("..., rel:other ( ... )")` embed comes back as an object for a
// to-one relation, but supabase-js types it (and sometimes returns it) as an
// array. Every query file that reads an embed needs the same "take the first, or
// null" step - this is the one copy of it.

/** First element of a to-one PostgREST embed, or null. Accepts object, array, null. */
export function unwrapRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

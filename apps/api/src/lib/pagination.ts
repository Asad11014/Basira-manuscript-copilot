import { DEFAULT_PAGE_SIZE, type Paginated } from '@basira/shared';

/** Prisma args for id-based cursor pagination. Fetches one extra to detect more. */
export function paginateArgs(query: { cursor?: string; limit?: number }) {
  const take = query.limit ?? DEFAULT_PAGE_SIZE;
  return {
    take: take + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  };
}

/** Split the over-fetched rows into a page + nextCursor, mapping to DTOs. */
export function paginateResult<TRow extends { id: string }, TDto>(
  rows: TRow[],
  map: (row: TRow) => TDto,
  query: { limit?: number },
): Paginated<TDto> {
  const take = query.limit ?? DEFAULT_PAGE_SIZE;
  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;
  const last = page.at(-1);
  return {
    items: page.map(map),
    nextCursor: hasMore && last ? last.id : null,
  };
}

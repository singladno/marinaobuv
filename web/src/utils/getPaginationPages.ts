export type PaginationItem = number | 'ellipsis';

export function getPaginationPages(
  current: number,
  totalPages: number
): PaginationItem[] {
  const pages: PaginationItem[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  const addRange = (from: number, to: number) => {
    for (let i = from; i <= to; i++) pages.push(i);
  };
  pages.push(1);
  if (current > 4) pages.push('ellipsis');
  addRange(Math.max(2, current - 1), Math.min(totalPages - 1, current + 1));
  if (current < totalPages - 3) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}

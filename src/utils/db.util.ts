export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
}

export const buildSort = (
  field: string,
  order: 'asc' | 'desc',
): Record<string, 'asc' | 'desc'> => ({
  [field]: order,
});

export const computeOffset = (page: number, limit: number): number => (page - 1) * limit;

type PrismaDelegate = {
  findMany: (args: any) => Promise<any[]>;
  count: (args: any) => Promise<number>;
};

/**
 * Paginate a Prisma query
 * @param delegate - Prisma delegate (e.g., prisma.user, prisma.chatMessage)
 * @param options - Pagination options
 * @param where - Prisma where clause
 * @param include - Prisma include clause (optional)
 * @param select - Prisma select clause (optional)
 */
export async function paginateQuery<T>(
  delegate: PrismaDelegate,
  options: PaginationOptions = {},
  where?: any,
  include?: any,
  select?: any,
): Promise<PaginationResult<T>> {
  const { page, limit, sort, order = 'desc' } = options;

  // Build where clause
  const whereClause = where || {};

  // Count total records
  const total = await delegate.count({ where: whereClause });

  // Build findMany options
  const findManyOptions: any = {
    where: whereClause,
  };

  if (include) findManyOptions.include = include;
  if (select) findManyOptions.select = select;

  // Apply sorting
  if (sort) {
    findManyOptions.orderBy = buildSort(sort, order);
  }

  // Apply pagination
  if (limit) {
    const currentPage = Math.max(page || 1, 1);
    const safeLimit = Math.max(limit, 1);
    findManyOptions.skip = computeOffset(currentPage, safeLimit);
    findManyOptions.take = safeLimit;

    const data = await delegate.findMany(findManyOptions);
    const totalPages = Math.ceil(total / safeLimit);
    return {
      data: data as T[],
      total,
      currentPage,
      totalPages,
      limit: safeLimit,
    } as PaginationResult<T>;
  }

  // No pagination - return all
  const data = await delegate.findMany(findManyOptions);
  return { data: data as T[], total } as PaginationResult<T>;
}

/**
 * Add search filters to Prisma where clause
 * @param where - Existing Prisma where clause
 * @param searchTerm - Search term
 * @param searchableFields - Fields to search in
 */
export function addSearchFilters(where: any, searchTerm: string, searchableFields: string[]): any {
  if (!searchTerm || searchableFields.length === 0) return where;

  const searchConditions = searchableFields.map((field) => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive' as const,
    },
  }));

  const existingWhere = (where || {}) as Record<string, any>;
  return {
    ...existingWhere,
    OR: searchConditions,
  };
}

type FindDelegate = {
  findUnique: (args: any) => Promise<any>;
  findFirst: (args: any) => Promise<any>;
};

/**
 * Find one record or throw an error
 * @param delegate - Prisma delegate (e.g., prisma.user)
 * @param options - Find options
 */
export async function findOneOrThrow<T>(
  delegate: FindDelegate,
  options: {
    where: any;
    include?: any;
    select?: any;
    field: string;
    message: string;
    shouldExist?: boolean;
  },
): Promise<T> {
  const { where, include, select, field, message, shouldExist = true } = options;

  const findOptions: any = { where };
  if (include) findOptions.include = include;
  if (select) findOptions.select = select;

  // Try findUnique first (for unique fields like id), fallback to findFirst
  let entity: T | null = null;
  try {
    entity = await delegate.findUnique(findOptions);
  } catch {
    entity = await delegate.findFirst(findOptions);
  }

  if (shouldExist && !entity) {
    const err = new Error(message);
    (err as any).field = field;
    throw err;
  }

  if (!shouldExist && entity) {
    const err = new Error(message);
    (err as any).field = field;
    throw err;
  }

  return entity as T;
}

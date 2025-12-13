import {
  buildVersionedCacheKey,
  cacheGet,
  cacheSet,
  cacheDel,
  incrementCacheVersion,
  invalidateEntityListCache,
  makeKey,
  paginateQuery,
  PaginationOptions,
  PaginationResult,
} from '@/utils';

type PrismaDelegate = {
  findUnique: (args: any) => Promise<any>;
  findMany: (args: any) => Promise<any[]>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  count: (args: any) => Promise<number>;
};

type ListCacheKeyParams = {
  prefix: string[];
  pagination?: PaginationOptions;
  extra?: (string | number)[];
};

const buildListCacheKey = async (entity: string, params: ListCacheKeyParams): Promise<string> => {
  const { prefix, pagination, extra = [] } = params;
  const { page = 1, limit, sort = 'createdAt', order = 'desc' } = pagination || {};

  const keyParts = limit
    ? ['list', page, limit, sort, order, ...extra]
    : ['list', 'all', sort, order, ...extra];

  return buildVersionedCacheKey(entity, [...prefix, ...keyParts]);
};

const SINGLE_TTL_SECONDS = 20 * 60; // 20 mins
const LIST_TTL_SECONDS = 15 * 60; // 15 mins

export const createCachedRepository = <T, D extends PrismaDelegate>(
  delegate: D,
  entityName: string,
  ttlSeconds?: number,
  listTtlSeconds?: number,
) => {
  const singleKey = (id: string) => makeKey(entityName, id);

  return {
    async create(payload: any, include?: any, select?: any) {
      const createArgs: any = { data: payload };
      if (include) createArgs.include = include;
      if (select) createArgs.select = select;

      const doc = await delegate.create(createArgs);
      const docId = (doc as any).id || (doc as any)._id?.toString();

      if (docId) {
        await cacheSet(singleKey(docId), doc, ttlSeconds || SINGLE_TTL_SECONDS);
      }
      await incrementCacheVersion(entityName);
      await invalidateEntityListCache(entityName);
      return doc as T;
    },

    async findById(id: string, include?: any, select?: any): Promise<T | null> {
      const key = singleKey(id);
      const cached = await cacheGet<T>(key);
      if (cached) return cached;

      const findArgs: any = { where: { id } };
      if (include) findArgs.include = include;
      if (select) findArgs.select = select;

      const doc = await delegate.findUnique(findArgs);
      if (doc) {
        await cacheSet(key, doc as any, ttlSeconds || SINGLE_TTL_SECONDS);
      }
      return doc as T | null;
    },

    async updateById(id: string, payload: any, include?: any, select?: any): Promise<T | null> {
      const updateArgs: any = {
        where: { id },
        data: payload,
      };
      if (include) updateArgs.include = include;
      if (select) updateArgs.select = select;

      const doc = await delegate.update(updateArgs);
      if (doc) {
        await cacheSet(singleKey(id), doc as any, ttlSeconds || SINGLE_TTL_SECONDS);
      }
      await incrementCacheVersion(entityName);
      await invalidateEntityListCache(entityName);
      return doc as T | null;
    },

    async deleteById(id: string): Promise<T | null> {
      const doc = await delegate.delete({ where: { id } });
      if (doc) {
        await cacheDel(singleKey(id));
        await incrementCacheVersion(entityName);
        await invalidateEntityListCache(entityName);
      }
      return doc as T | null;
    },

    async list(
      dto: PaginationOptions & {
        extraCacheParams?: (string | number)[];
        where?: any;
        include?: any;
        select?: any;
      } = {},
    ): Promise<PaginationResult<T>> {
      const { extraCacheParams = [], where, include, select, ...pagination } = dto;
      const cacheKey = await buildListCacheKey(entityName, {
        prefix: ['list'],
        pagination,
        extra: extraCacheParams,
      });

      const cached = await cacheGet<PaginationResult<T>>(cacheKey);
      if (cached) return cached;

      const result = await paginateQuery<T>(delegate, pagination, where, include, select);

      await cacheSet(cacheKey, result, listTtlSeconds || LIST_TTL_SECONDS);
      return result;
    },

    async findMany(where?: any, include?: any, select?: any, orderBy?: any): Promise<T[]> {
      const findArgs: any = {};
      if (where) findArgs.where = where;
      if (include) findArgs.include = include;
      if (select) findArgs.select = select;
      if (orderBy) findArgs.orderBy = orderBy;

      const docs = await delegate.findMany(findArgs);
      return docs as T[];
    },

    async count(where?: any): Promise<number> {
      const countArgs: any = {};
      if (where) countArgs.where = where;
      return delegate.count(countArgs);
    },
  };
};

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from './';
import { hashPassword } from '@/utils';
import { StringFieldUpdateOperationsInput } from 'generated/prisma/internal/prismaNamespace';

// Connection string for database
const connectionString: string = env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter }).$extends({
  query: {
    $allModels: {
      async delete({ args, query }: { args: any; query: (args: any) => Promise<any> }) {
        return query({
          ...args,
          data: {
            ...(args.data ?? {}),
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      },
    },
    user: {
      async create({ args, query }: { args: { data: { password?: string } }; query: Function }) {
        if (args.data && args.data.password) {
          args.data.password = await hashPassword(args.data.password);
        }
        return query(args);
      },
      async update({
        args,
        query,
      }: {
        args: { data: { password?: string | StringFieldUpdateOperationsInput } };
        query: Function;
      }) {
        if (args.data && args.data.password) {
          args.data.password = await hashPassword(args.data.password as string);
        }
        return query(args);
      },
    },
  },
});

export { prisma };

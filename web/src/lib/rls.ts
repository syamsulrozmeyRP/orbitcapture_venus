import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function withUserContext<T>(
  userId: string,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  client: PrismaClient = prisma,
) {
  return client.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, false)`;
    return callback(tx);
  });
}

import { endOfMonth, startOfMonth } from "date-fns";

import { withUserContext } from "@/lib/rls";

export const MONTHLY_CREDIT_LIMIT = 50000;

export type AiCreditSnapshot = {
  used: number;
  limit: number;
};

export async function getAiCreditUsage(userId?: string | null, workspaceId?: string | null): Promise<AiCreditSnapshot> {
  if (!userId || !workspaceId) {
    return {
      used: 0,
      limit: MONTHLY_CREDIT_LIMIT,
    };
  }

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const usage = await withUserContext(userId, (tx) =>
    tx.aiUsage.aggregate({
      _sum: { promptTokens: true, completionTokens: true },
      where: {
        workspaceId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    })
  );

  const used = (usage._sum.promptTokens ?? 0) + (usage._sum.completionTokens ?? 0);

  return {
    used,
    limit: MONTHLY_CREDIT_LIMIT,
  };
}


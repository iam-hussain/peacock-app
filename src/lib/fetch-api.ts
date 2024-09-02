import { MemberTransactionResponse } from "@/app/api/member-transactions/route";
import { MemberResponse } from "@/app/api/members/route";

export const fetchMembers = async (): Promise<{
     members: MemberResponse[]
  }> => {
    const res = await fetch('/api/members');
  
    if (!res.ok) {
      throw new Error('Failed to fetch transactions');
    }

    return res.json();
  };

  
export const fetchMemberTransactions = async (options: any): Promise<{transactions: MemberTransactionResponse[], totalPages: number 
}> => {
  const params = new URLSearchParams({
    page: options.page.toString(),
    limit: options.limit.toString(),
    fromId: options.fromId.trim(),
    toId: options.toId.trim(),
    transactionType: options.transactionType.trim(),
    sortField: options.sortField,
    sortOrder: options.sortOrder,
    ...(options?.startDate ? { startDate: options.startDate as any } : {}),
    ...(options?.endDate ? { endDate: options.endDate as any } : {}),
  });

  const res = await fetch(`/api/member-transactions?${params.toString()}`);

  if (!res.ok) {
    throw new Error('Failed to fetch transactions');
  }

  return res.json();
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Account, Passbook } from "@prisma/client";
import { NextResponse } from "next/server";

import prisma from "@/db";
import { chitCalculator } from "@/lib/helper";
import { getMemberClubStats } from "@/lib/member-club-stats";
import { VendorPassbookData } from "@/lib/type";
import {
  membersTableTransform,
  transformLoanForTable,
} from "@/transformers/account";

type VendorToTransform = Account & { passbook: Passbook };

function transformVendorForTable(vendorInput: VendorToTransform) {
  const { passbook, ...vendor } = vendorInput;
  const { totalInvestment = 0, totalReturns = 0 } =
    passbook.payload as VendorPassbookData;

  const statusData: {
    nextDueDate: number | null;
    monthsPassedString: string | null;
  } = { nextDueDate: null, monthsPassedString: null };

  if (vendor.active) {
    const chitData = chitCalculator(vendor.startAt, vendor?.endAt);
    statusData.nextDueDate = vendor.active ? chitData.nextDueDate : null;
    statusData.monthsPassedString = chitData.monthsPassedString;
  }

  return {
    id: vendor.id,
    name: `${vendor.firstName}${vendor.lastName ? ` ${vendor.lastName}` : ""}`,
    avatar: vendor.avatar ? `/image/${vendor.avatar}` : undefined,
    startAt: vendor.startAt.getTime(),
    endAt: vendor.endAt ? vendor.endAt.getTime() : null,
    status: vendor.active ? "Active" : "Disabled",
    active: vendor.active,
    totalInvestment,
    totalReturns,
    totalProfitAmount: Math.max(totalReturns - totalInvestment, 0),
    ...statusData,
  };
}

export async function POST(request: Request) {
  try {
    const { searchQuery } = await request.json();

    if (!searchQuery || searchQuery.trim().length < 2) {
      return NextResponse.json({
        members: [],
        vendors: [],
        loans: [],
        transactions: [],
      });
    }

    const query = searchQuery.toLowerCase().trim();

    // Fetch all data in parallel
    const [allMembers, allVendors, allTransactions] = await Promise.all([
      prisma.account.findMany({
        where: { isMember: true },
        include: { passbook: true },
      }),
      prisma.account.findMany({
        where: { isMember: false },
        include: { passbook: true },
      }),
      prisma.transaction.findMany({
        take: 50, // Limit transactions for performance
        include: {
          from: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              active: true,
              isMember: true,
            },
          },
          to: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              active: true,
              isMember: true,
            },
          },
        },
        orderBy: { transactionAt: "desc" },
      }),
    ]);

    // Get stats for member transformations
    const stats = await getMemberClubStats();
    const {
      memberTotalDeposit,
      totalReturnPerMember,
      expectedLoanProfitPerMember,
    } = stats;

    // Transform members
    const transformedMembers = allMembers.map((member) =>
      membersTableTransform(
        member,
        memberTotalDeposit,
        totalReturnPerMember,
        expectedLoanProfitPerMember
      )
    );

    // Transform vendors
    const transformedVendors = allVendors.map(transformVendorForTable);

    // Transform loans (on-the-fly calculation)
    const transformedLoansPromises = allMembers.map(transformLoanForTable)
    const transformedLoans = (await Promise.all(transformedLoansPromises)).filter(
      (loan) => loan.active || loan.loanHistory.length > 0
    )

    // Filter members - improved search to handle partial matches and normalize spaces
    // Also search on original account data for firstName/lastName separately
    const filteredMembers = transformedMembers.filter((member) => {
      const normalizedName = member.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      const normalizedQuery = query.trim().replace(/\s+/g, " ");
      const queryWords = normalizedQuery
        .split(" ")
        .filter((w: string) => w.length > 0);

      // Find original account data
      const originalMember = allMembers.find((m) => m.id === member.id);
      if (originalMember) {
        const firstName = (originalMember.firstName || "").toLowerCase();
        const lastName = (originalMember.lastName || "").toLowerCase();

        // Check firstName and lastName separately
        if (
          queryWords.some(
            (word: string) =>
              firstName.includes(word) || lastName.includes(word)
          )
        ) {
          return true;
        }

        // Check if query matches firstName + lastName combination
        if (queryWords.length > 1) {
          const matchesFirstName = queryWords.some((word: string) =>
            firstName.includes(word)
          );
          const matchesLastName = queryWords.some((word: string) =>
            lastName.includes(word)
          );
          if (matchesFirstName && matchesLastName) {
            return true;
          }
        }
      }

      // Check full name match
      if (normalizedName.includes(normalizedQuery)) {
        return true;
      }

      // Check if all query words are found in the name (for multi-word searches)
      if (
        queryWords.length > 1 &&
        queryWords.every((word: string) => normalizedName.includes(word))
      ) {
        return true;
      }

      // Check individual word matches
      if (queryWords.some((word: string) => normalizedName.includes(word))) {
        return true;
      }

      // Check username and ID
      if (
        member.username.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query)
      ) {
        return true;
      }

      return false;
    });

    // Filter vendors - improved search to handle partial matches
    const filteredVendors = transformedVendors.filter((vendor) => {
      const normalizedName = vendor.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      const normalizedQuery = query.trim().replace(/\s+/g, " ");

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedQuery
          .split(" ")
          .some((word: string) => normalizedName.includes(word)) ||
        vendor.id.toLowerCase().includes(query)
      );
    });

    // Filter loans (by member name) - improved search to handle partial matches
    const filteredLoans = transformedLoans.filter((loan) => {
      const normalizedName = loan.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      const normalizedQuery = query.trim().replace(/\s+/g, " ");

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedQuery
          .split(" ")
          .some((word: string) => normalizedName.includes(word)) ||
        loan.id.toLowerCase().includes(query)
      );
    });

    // Filter transactions (by member/vendor names or amount)
    const filteredTransactions = allTransactions
      .map((tx) => {
        const fromName = `${tx.from.firstName || ""} ${
          tx.from.lastName || ""
        }`.trim();
        const toName =
          `${tx.to.firstName || ""} ${tx.to.lastName || ""}`.trim();
        return {
          id: tx.id,
          fromName,
          toName,
          amount: tx.amount,
          transactionType: tx.transactionType,
          transactionAt: tx.transactionAt.getTime(),
        };
      })
      .filter(
        (tx) =>
          tx.fromName.toLowerCase().includes(query) ||
          tx.toName.toLowerCase().includes(query) ||
          tx.amount.toString().includes(query) ||
          tx.id.toLowerCase().includes(query)
      )
      .slice(0, 10); // Limit to 10 most recent matching transactions

    return NextResponse.json({
      members: filteredMembers.slice(0, 5).map((m) => ({
        id: m.id,
        name: m.name,
        username: m.username,
        avatar: m.avatar,
        link: m.link,
        active: m.active,
      })),
      vendors: filteredVendors.slice(0, 5).map((v) => ({
        id: v.id,
        name: v.name,
        avatar: v.avatar,
        active: v.active,
      })),
      loans: filteredLoans.slice(0, 5).map((l) => ({
        id: l.id,
        name: l.name,
        avatar: l.avatar,
        link: l.link,
        active: l.active,
      })),
      transactions: filteredTransactions,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

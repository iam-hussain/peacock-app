import prisma from '@/db';
import { VendorTransaction } from '@prisma/client';
import { NextResponse } from 'next/server';

type VendorTransactionToTransform = VendorTransaction & {
  vendor: {
    id: string
    name: string
    active: boolean
  };
  member:  {
    id: string
    firstName: string
    lastName: string | null
    avatar: string | null
    active: boolean
  };
};

export type VendorTransactionResponse = ReturnType<typeof vendorsTransactionTableTransform>

function vendorsTransactionTableTransform(
  transaction: VendorTransactionToTransform
) {
  const { vendor, member } = transaction
  return {
    vendor: {
      id: vendor.id,
      name: vendor.name,
      active: vendor.active,
    },
    member: {
      id: member.id,
      name: `${member.firstName}${member.lastName ? ` ${member.lastName}` : ""}`,
      avatar: member.avatar
      ? `/image/${member.avatar}`
      : "/image/no_image_available.jpeg",
      active: member.active,
    },
    transactionType: transaction.transactionType,
    transactionAt: transaction.transactionAt,
    amount: transaction.amount,
    method: transaction.method,
    note: transaction.note,
    createdAt: transaction.createdAt,
    id: transaction.id,
  }
}


// GET: Fetch vendor transactions with pagination
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  try {
    const transaction = await prisma.vendorTransaction.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            active: true
          }
        },
        member: {
          select: {
            id: true,
            avatar: true,
            firstName: true,
            lastName: true,
            active: true
          }
        },
      },
      orderBy: {
        transactionAt: 'desc', // Sort by transaction date
      },
    });

    const totalTransactions = await prisma.vendorTransaction.count();

    return NextResponse.json({
      transaction:transaction.map(vendorsTransactionTableTransform) ,
      total: totalTransactions,
      page,
      totalPages: Math.ceil(totalTransactions / limit),
    });
  } catch (error) {
    console.error('Error fetching vendor transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { vendorId, memberId, amount, transactionType, method, note } = await request.json();

    // Validate required fields
    if (!vendorId || !memberId || !amount || !transactionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a vendor transaction
    const vendorTransaction = await prisma.vendorTransaction.create({
      data: {
        vendorId,
        memberId,
        amount: parseFloat(amount),
        transactionType,
        method: method || 'ACCOUNT',
        note: note || undefined,
      },
    });

    return NextResponse.json({ success: true, vendorTransaction }, { status: 201 });
  } catch (error) {
    console.error('Failed to create transaction', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

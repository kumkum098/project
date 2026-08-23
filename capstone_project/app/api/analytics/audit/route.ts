import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from') as string) : undefined;
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to') as string) : undefined;
    
    // Pagination (OFFSET / LIMIT)
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Queries audit logs with JOIN to SellerProfile (user), filtering, and pagination
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(action && { action }),
        ...(fromDate && toDate && { createdAt: { gte: fromDate, lte: toDate } })
      },
      include: {
        user: {
          select: { displayName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.auditLog.count({
      where: {
        ...(action && { action }),
        ...(fromDate && toDate && { createdAt: { gte: fromDate, lte: toDate } })
      }
    });

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch audit logs', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { mongoUserId, action, entityType, entityId, oldValue, newValue } = payload;

    // Resolve mongoUserId to internal SellerProfile ID
    const user = await prisma.sellerProfile.findUnique({
      where: { mongoUserId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found for audit logging' }, { status: 404 });
    }

    // Creates audit log entry demonstrating INSERT with Foreign Key
    const log = await prisma.auditLog.create({
      data: {
        userId: user.id, // FK insertion
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
      }
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create audit log', details: error.message }, { status: 500 });
  }
}

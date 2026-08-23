import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Require admin authentication (or at least a valid session for demonstration)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'monthly';
    const categoryFilter = searchParams.get('category');
    const fromDate = searchParams.get('from') ? new Date(searchParams.get('from') as string) : new Date(0);
    const toDate = searchParams.get('to') ? new Date(searchParams.get('to') as string) : new Date();

    // Query 1: Sales report joining TicketAnalytics, SaleRecord, EventCategory (using ORM includes)
    // Grouping by month conceptually via Prisma
    const salesReportRaw = await prisma.saleRecord.findMany({
      where: {
        completedAt: { gte: fromDate, lte: toDate },
        ...(categoryFilter ? { ticket: { category: { name: categoryFilter } } } : {})
      },
      include: {
        ticket: {
          include: { category: true, venue: true }
        },
        seller: true
      },
      orderBy: { salePrice: 'desc' }
    });

    // Query 2: Top sellers with filtering by date range
    const topSellers = await prisma.sellerProfile.findMany({
      where: {
        salesRecords: {
          some: { completedAt: { gte: fromDate, lte: toDate } }
        }
      },
      orderBy: { totalRevenue: 'desc' },
      take: 10,
      include: {
        _count: { select: { salesRecords: true } }
      }
    });

    // Query 3: Category performance with having clause (Prisma groupBy with having)
    const categoryPerformance = await prisma.ticketAnalytics.groupBy({
      by: ['categoryId'],
      _sum: { soldPrice: true },
      _count: { id: true },
      where: { status: 'SOLD', soldAt: { gte: fromDate, lte: toDate } },
      having: {
        id: { _count: { gt: 0 } } // Having min sales > 0
      },
      orderBy: { _sum: { soldPrice: 'desc' } }
    });

    // Resolve category names for query 3
    const categories = await prisma.eventCategory.findMany({
      where: { id: { in: categoryPerformance.map(c => c.categoryId) } }
    });
    
    const enrichedCategoryPerformance = categoryPerformance.map(cp => ({
      ...cp,
      categoryName: categories.find(c => c.id === cp.categoryId)?.name
    }));

    // Query 4: Subquery equivalent - Tickets priced above category average
    // First, get averages per category
    const categoryAverages = await prisma.ticketAnalytics.groupBy({
      by: ['categoryId'],
      _avg: { originalPrice: true }
    });

    // Then find tickets above those averages
    const premiumTickets = [];
    for (const avg of categoryAverages) {
      if (avg._avg.originalPrice) {
        const tickets = await prisma.ticketAnalytics.findMany({
          where: {
            categoryId: avg.categoryId,
            originalPrice: { gt: avg._avg.originalPrice }
          },
          include: { category: true },
          take: 5
        });
        premiumTickets.push(...tickets);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        salesReportRaw,
        topSellers,
        categoryPerformance: enrichedCategoryPerformance,
        premiumTickets
      }
    });
  } catch (error: any) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to generate reports', details: error.message }, { status: 500 });
  }
}

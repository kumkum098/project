import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Marketplace Sales Report - Joins 4 tables
    // TicketAnalytics + EventCategory + Venue + SellerProfile
    const salesReport = await prisma.ticketAnalytics.findMany({
      where: {
        status: 'SOLD',
        saleRecord: {
          isNot: null,
        },
      },
      include: {
        category: {
          select: {
            name: true,
            description: true,
          },
        },
        venue: {
          select: {
            name: true,
            city: true,
            state: true,
            country: true,
          },
        },
        seller: {
          select: {
            displayName: true,
            email: true,
            trustScore: true,
          },
        },
        saleRecord: {
          select: {
            salePrice: true,
            platformFee: true,
            sellerAmount: true,
            paymentMethod: true,
            transactionRef: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Transform the data for the report
    const report = salesReport.map((ticket) => ({
      ticketId: ticket.id,
      mongoTicketId: ticket.mongoTicketId,
      title: ticket.title,
      category: ticket.category.name,
      categoryDescription: ticket.category.description,
      venue: ticket.venue.name,
      venueLocation: `${ticket.venue.city}, ${ticket.venue.state || ''} ${ticket.venue.country}`,
      eventDate: ticket.eventDate,
      originalPrice: parseFloat(ticket.originalPrice.toString()),
      soldPrice: ticket.saleRecord ? parseFloat(ticket.saleRecord.salePrice.toString()) : null,
      platformFee: ticket.saleRecord ? parseFloat(ticket.saleRecord.platformFee.toString()) : null,
      sellerAmount: ticket.saleRecord ? parseFloat(ticket.saleRecord.sellerAmount.toString()) : null,
      sellerName: ticket.seller.displayName,
      sellerEmail: ticket.seller.email,
      sellerTrustScore: parseFloat(ticket.seller.trustScore.toString()),
      paymentMethod: ticket.saleRecord?.paymentMethod,
      transactionRef: ticket.saleRecord?.transactionRef,
      soldAt: ticket.saleRecord?.completedAt,
      views: ticket.views,
    }));

    // Calculate summary statistics
    const totalSales = report.length;
    const totalRevenue = report.reduce((sum, item) => sum + (item.soldPrice || 0), 0);
    const totalPlatformFees = report.reduce((sum, item) => sum + (item.platformFee || 0), 0);
    const averageSalePrice = totalSales > 0 ? totalRevenue / totalSales : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalSales,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPlatformFees: Math.round(totalPlatformFees * 100) / 100,
        averageSalePrice: Math.round(averageSalePrice * 100) / 100,
      },
      data: report,
    });

  } catch (error) {
    console.error('Marketplace report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
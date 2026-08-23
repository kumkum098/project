import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { tickets = [], users = [], transactions = [] } = payload;

    // Use Prisma TRANSACTION to atomically write data from MongoDB to PostgreSQL
    const result = await prisma.$transaction(async (tx) => {
      let syncedRecords = 0;

      // Sync Users (Sellers/Buyers)
      for (const user of users) {
        await tx.sellerProfile.upsert({
          where: { mongoUserId: user._id },
          update: {
            displayName: user.name || 'Unknown',
            trustScore: user.trustScore || 5.0,
            totalSales: user.totalSales || 0,
            totalRevenue: user.totalRevenue || 0
          },
          create: {
            mongoUserId: user._id,
            email: user.email,
            displayName: user.name || 'Unknown',
            trustScore: user.trustScore || 5.0,
            totalSales: user.totalSales || 0,
            totalRevenue: user.totalRevenue || 0
          }
        });
        syncedRecords++;
      }

      // Sync Categories and Venues required for Tickets
      for (const ticket of tickets) {
        const category = await tx.eventCategory.upsert({
          where: { name: ticket.category },
          update: {},
          create: { name: ticket.category }
        });

        const venue = await tx.venue.upsert({
          where: { name_city: { name: ticket.venue.name, city: ticket.venue.city } },
          update: {},
          create: { name: ticket.venue.name, city: ticket.venue.city, state: ticket.venue.state, country: ticket.venue.country || 'India' }
        });

        const seller = await tx.sellerProfile.findUnique({ where: { mongoUserId: ticket.sellerId } });
        
        if (seller) {
          await tx.ticketAnalytics.upsert({
            where: { mongoTicketId: ticket._id },
            update: {
              status: ticket.status.toUpperCase(),
              soldPrice: ticket.soldPrice,
              soldAt: ticket.soldAt ? new Date(ticket.soldAt) : null,
              views: ticket.views || 0,
            },
            create: {
              mongoTicketId: ticket._id,
              title: ticket.title,
              originalPrice: ticket.price,
              categoryId: category.id,
              venueId: venue.id,
              eventDate: new Date(ticket.eventDate),
              status: ticket.status.toUpperCase(),
              sellerId: seller.id
            }
          });
          syncedRecords++;
        }
      }

      // Sync Transactions (SaleRecords)
      for (const t of transactions) {
        const ticketAnalytics = await tx.ticketAnalytics.findUnique({ where: { mongoTicketId: t.ticketId } });
        const sellerProfile = await tx.sellerProfile.findUnique({ where: { mongoUserId: t.sellerId } });
        const buyerProfile = await tx.sellerProfile.findUnique({ where: { mongoUserId: t.buyerId } });

        if (ticketAnalytics && sellerProfile && buyerProfile) {
          await tx.saleRecord.upsert({
            where: { transactionRef: t.transactionId },
            update: {},
            create: {
              ticketId: ticketAnalytics.id,
              sellerId: sellerProfile.id,
              buyerId: buyerProfile.id,
              salePrice: t.amount,
              platformFee: t.platformFee,
              sellerAmount: t.sellerAmount,
              paymentMethod: t.paymentMethod,
              transactionRef: t.transactionId,
              completedAt: new Date(t.createdAt)
            }
          });
          syncedRecords++;
        }
      }

      return { syncedRecords };
    });

    return NextResponse.json({ success: true, message: 'Sync completed', data: result });
  } catch (error: any) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: 'Sync failed', details: error.message }, { status: 500 });
  }
}

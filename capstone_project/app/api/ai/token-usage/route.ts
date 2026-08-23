import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTokenUsageStats } from '@/lib/gemini';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin check - adjust based on actual admin role implementation
    // Assuming session.user.role exists or you can check email
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Ideally check if user is admin here
    // if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const stats = getTokenUsageStats();

    return NextResponse.json({
      success: true,
      data: {
        totalRequests: stats.totalRequests,
        totalTokens: stats.totalTokens,
        estimatedCostUSD: stats.estimatedCost,
        breakdownByEndpoint: stats.endpoints
      }
    });
  } catch (error) {
    console.error('Token usage stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

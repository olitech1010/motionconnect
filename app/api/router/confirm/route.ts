import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transaction.service';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-api-key');
  const queryParam = request.nextUrl.searchParams.get('key');
  const apiKey = authHeader || queryParam;

  if (apiKey !== process.env.ROUTER_SYNC_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Unauthorized router confirm request');
    }
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const textBody = await request.text();
    const references = textBody
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    let syncedCount = 0;

    for (const ref of references) {
      // mark it as synced in the database
      try {
        await TransactionService.updateTransaction(ref, {
          mikrotik_synced: true
        });
        syncedCount++;
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(`Failed to update sync status for ${ref}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true, synced: syncedCount });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Router confirm error:', err);
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

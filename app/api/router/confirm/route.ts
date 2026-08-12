import { NextRequest, NextResponse } from 'next/server';
import { TransactionService } from '@/services/transaction.service';

export async function POST(request: NextRequest) {
  // Accept both header names for backwards compatibility
  const apiKey =
    request.headers.get('x-router-key') ||
    request.headers.get('x-api-key') ||
    request.nextUrl.searchParams.get('key');

  if (apiKey !== process.env.ROUTER_SYNC_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Unauthorized router confirm request');
    }
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    let references: string[] = [];

    // Support both JSON body (new router-poll.rsc) and plain text (legacy script)
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // New JSON format: { "ids": ["ref1", "ref2"] }
      const body = await request.json();
      references = body.ids || [];
    } else {
      // Legacy plain text format: newline-separated references
      const textBody = await request.text();
      references = textBody
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
    }

    let syncedCount = 0;

    for (const ref of references) {
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

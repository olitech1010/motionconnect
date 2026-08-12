import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PackageService } from '@/services/package.service'

export async function GET(request: NextRequest) {
  // Accept both header names for backwards compatibility
  const apiKey =
    request.headers.get('x-router-key') ||
    request.headers.get('x-api-key') ||
    request.nextUrl.searchParams.get('key');

  if (apiKey !== process.env.ROUTER_SYNC_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Unauthorized router sync request');
    }
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    
    // get unsynced successful transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'success')
      .eq('mikrotik_synced', false);
      
    if (error) {
      throw error;
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json([]);
    }
    
    const payload = [];

    for (const tx of transactions) {
      const pkg = tx.package_id ? await PackageService.getPackageById(tx.package_id) : null;
      if (!pkg) continue;
      
      const username = tx.mikrotik_username || tx.voucher_code?.toLowerCase() || tx.reference.toLowerCase();
      
      let limitUptime = `${pkg.duration_seconds}s`;
      if (pkg.duration_seconds % 86400 === 0) {
        limitUptime = `${pkg.duration_seconds / 86400}d`;
      } else if (pkg.duration_seconds % 3600 === 0) {
        limitUptime = `${pkg.duration_seconds / 3600}h`;
      } else if (pkg.duration_seconds % 60 === 0) {
        limitUptime = `${pkg.duration_seconds / 60}m`;
      }

      const profile = pkg.mikrotik_profile || 'default';

      payload.push({
        id: tx.reference,
        mac: (tx.mac_address || '00:00:00:00:00:00').toUpperCase(),
        username,
        password: username, // Password MUST match username — single value, no mismatch
        profile,
        uptime: limitUptime,
      });
    }

    return NextResponse.json(payload);

  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Router sync error:', err);
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

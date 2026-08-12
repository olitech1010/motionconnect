import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PackageService } from '@/services/package.service'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('x-api-key');
  const queryParam = request.nextUrl.searchParams.get('key');
  const apiKey = authHeader || queryParam;

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

    let responseText = 'username;password;profile;limit-uptime;reference\n'
    
    if (!transactions || transactions.length === 0) {
      return new NextResponse(responseText.trim(), { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    
    for (const tx of transactions) {
      const pkg = tx.package_id ? await PackageService.getPackageById(tx.package_id) : null
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
      
      responseText += `${username};${username};${profile};${limitUptime};${tx.reference}\n`;
    }

    if (responseText === 'username;password;profile;limit-uptime;reference\n') {
      return new NextResponse(responseText, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    return new NextResponse(responseText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });

  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Router sync error:', err);
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

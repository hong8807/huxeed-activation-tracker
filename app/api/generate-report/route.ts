import { createClient } from '@/lib/supabase/server';
import { generateReport } from '@/lib/report-generator';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') as 'ppt' | 'html' | null;

    if (!format || !['ppt', 'html'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use ?format=ppt or ?format=html' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const result = await generateReport(supabase, format);

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': String(result.buffer.length),
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: String(error) },
      { status: 500 }
    );
  }
}

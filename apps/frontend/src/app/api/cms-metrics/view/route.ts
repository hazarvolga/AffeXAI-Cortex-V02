import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';
    const authHeader = request.headers.get('authorization');

    const response = await fetch(`${backendUrl}/cms-metrics/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Page view track error:', error);
    return NextResponse.json(
      { message: 'Sayfa görüntüleme kaydedilemedi' },
      { status: 500 },
    );
  }
}

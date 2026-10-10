import { NextRequest, NextResponse } from 'next/server';
import { emailMarketingBackendApiUrl } from '../../../backend-url';

const BACKEND_URL = emailMarketingBackendApiUrl();
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const authHeaders = BACKEND_API_KEY
      ? { 'x-api-key': BACKEND_API_KEY }
      : undefined;

    const { campaignId } = await params;
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/email-marketing/ab-test/${campaignId}/select-winner`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeaders || {}),
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to select winner' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error selecting winner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

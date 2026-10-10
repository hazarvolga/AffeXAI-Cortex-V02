import { NextResponse } from 'next/server';
import { getEmailLogoUrl } from '@/lib/server/siteSettings';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isDarkMode = searchParams.get('dark') === 'true';
  
  try {
    const logoUrl = await getEmailLogoUrl(isDarkMode);
    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error('Error getting logo URL:', error);
    return NextResponse.json(
      { error: 'Failed to get logo URL' }, 
      { status: 500 }
    );
  }
}
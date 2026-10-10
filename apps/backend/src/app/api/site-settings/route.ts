import { NextResponse } from 'next/server';
import settingsService from '@/lib/api/settingsService';

export async function GET() {
  try {
    const settings = await settingsService.getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' }, 
      { status: 500 }
    );
  }
}
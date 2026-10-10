// Simple API test to check if backend is accessible
import { httpClient } from '@/lib/api/http-client';

export async function testApiConnection() {
  try {
    console.log('Testing API connection...');
    // Try to fetch a simple endpoint (this will fail if backend is not running)
    const response = await httpClient.get('/health');
    console.log('API connection successful:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('API connection failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    };
  }
}

// Run the test
if (typeof window !== 'undefined') {
  // Only run in browser environment
  testApiConnection().then(result => {
    if (result.success) {
      console.log('✅ Backend API is accessible');
    } else {
      console.warn('⚠️ Backend API is not accessible:', result.error);
      console.log('Please ensure the backend server is running on port 9006');
    }
  });
}
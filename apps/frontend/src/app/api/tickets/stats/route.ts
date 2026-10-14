import { NextRequest, NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/server/backend-api-url";

export async function GET(request: NextRequest) {
  try {
    const backendUrl = backendApiUrl();

    // Get JWT token from request
    const authHeader = request.headers.get("authorization");

    const response = await fetch(`${backendUrl}/tickets/analytics/stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Ticket stats fetch error:", error);
    return NextResponse.json(
      { message: "İstatistikler yüklenemedi" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/server/backend-api-url";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const backendUrl = backendApiUrl();

    // Get JWT token from request
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${backendUrl}/tickets?${searchParams.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader && { Authorization: authHeader }),
        },
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Tickets fetch error:", error);
    return NextResponse.json(
      { message: "Talepler yüklenemedi" },
      { status: 500 },
    );
  }
}

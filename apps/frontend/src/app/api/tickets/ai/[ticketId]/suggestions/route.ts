import { NextRequest, NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/server/backend-api-url";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  try {
    const { ticketId } = await params;
    const backendUrl = backendApiUrl();

    // Get JWT token from request
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${backendUrl}/tickets/ai/${ticketId}/suggestions`,
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
    console.error("AI suggestions fetch error:", error);
    return NextResponse.json(
      { message: "AI önerileri yüklenemedi" },
      { status: 500 },
    );
  }
}

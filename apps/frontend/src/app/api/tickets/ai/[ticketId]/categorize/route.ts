import { NextRequest, NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/server/backend-api-url";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  try {
    const { ticketId } = await params;
    const backendUrl = backendApiUrl();

    // Get JWT token from request
    const authHeader = request.headers.get("authorization");

    const response = await fetch(
      `${backendUrl}/tickets/ai/${ticketId}/categorize`,
      {
        method: "POST",
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
    console.error("AI categorization error:", error);
    return NextResponse.json(
      { message: "Kategori uygulanamadı" },
      { status: 500 },
    );
  }
}

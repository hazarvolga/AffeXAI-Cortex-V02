import { NextRequest, NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/server/backend-api-url";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const backendUrl = backendApiUrl();
    const authHeader = request.headers.get("authorization");

    const response = await fetch(`${backendUrl}/tickets/macros/${id}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    console.error("Macro execution error:", error);
    return NextResponse.json(
      { message: "Makro çalıştırılamadı" },
      { status: 500 },
    );
  }
}

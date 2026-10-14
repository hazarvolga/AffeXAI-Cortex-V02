import { NextRequest, NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/server/backend-api-url";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Media ID is required" },
        { status: 400 },
      );
    }

    // Fetch media from backend API
    const backendUrl = backendApiUrl();
    const response = await fetch(`${backendUrl}/media/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Backend returned ${response.status}: ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    // Handle wrapped response format {success: true, data: {...}}
    const media = data.data || data;

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch media",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

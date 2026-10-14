"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/api-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ChatDetailProps {
  sessionId: string;
}

export default function ChatDetail({ sessionId }: ChatDetailProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<{
    id: string;
    userName?: string;
    status: string;
    messageCount?: number;
    assignedSupport?: { userName: string };
  } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch(`/api/chat/sessions/${sessionId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        setSession(data);
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (isLoading && !session) {
    return (
      <Card className="h-[400px]">
        <CardContent className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 mb-4" />
          <p className="text-muted-foreground">Loading chat session...</p>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="h-[400px]">
        <CardContent className="flex flex-col items-center justify-center">
          <p className="text-muted-foreground">Session not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[400px]">
      <CardHeader>
        <h2 className="text-lg font-semibold">Chat Session Detail</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm">
            <strong>Session ID:</strong> {session.id}
          </p>
          <p className="text-sm">
            <strong>Customer:</strong> {session.userName}
          </p>
          <p className="text-sm">
            <strong>Status:</strong>
            <Badge
              variant={
                session.status === "active"
                  ? "default"
                  : session.status === "waiting"
                    ? "secondary"
                    : "destructive"
              }
            >
              {session.status}
            </Badge>
          </p>
          <p className="text-sm">
            <strong>Message Count:</strong> {session.messageCount}
          </p>
          <p className="text-sm">
            <strong>Assigned To:</strong>
            {session.assignedSupport
              ? session.assignedSupport.userName
              : "Unassigned"}
          </p>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Conversation</h3>
          <div className="h-[200px] overflow-y-auto border p-3 rounded">
            <p className="text-muted-italic">
              Message history would appear here
            </p>
          </div>

          <div className="mt-4">
            <form className="flex space-x-3">
              <Input placeholder="Type a message..." className="flex-1" />
              <Button variant="default">Send</Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/api-fetch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, MessageSquare, Users } from "lucide-react";

export interface ChatSession {
  id: string;
  userName: string;
  status: string;
  messageCount: number;
  lastMessageAt: Date;
}

interface ConversationListProps {
  onSessionSelect: (sessionId: string) => void;
  selectedSessionId: string | null;
}

export default function ConversationList({
  onSessionSelect,
  selectedSessionId,
}: ConversationListProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch(
          "/api/chat/support-dashboard/sessions",
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          },
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        setSessions(Array.isArray(data) ? data : data.sessions || []);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        setSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Conversations</h2>
        <Button variant="outline" size="icon" onClick={() => {}}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-sm">Loading...</p>
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <p className="text-muted-foreground">No conversations</p>
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow
                  key={session.id}
                  className={
                    selectedSessionId === session.id ? "bg-muted/50" : undefined
                  }
                  onClick={() => handleSessionClick(session.id)}
                >
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">
                        {session.id.slice(0, 8)}...
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded bg-secondary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-secondary" />
                      </div>
                      <span className="font-medium">{session.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className="px-2 py-1 rounded text-xs
                        {session.status === 'active' ? 'bg-green-100 text-green-800' :
                         session.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                         'bg-red-100 text-red-800'}"
                    >
                      {session.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {session.messageCount}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatDate(session.lastMessageAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionSelect(session.id);
                      }}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground text-right mt-2">
        Showing {sessions.length} conversations
      </div>
    </div>
  );
}

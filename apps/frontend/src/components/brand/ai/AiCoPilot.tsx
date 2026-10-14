import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  X,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { strategyService } from "@/lib/api/strategyService";

interface AiCoPilotProps {
  context: string;
  data?: Record<string, unknown>; // Safer than any
  variant?: "floating" | "inline" | "panel";
  onApply?: (content: string) => void;
}

export function AiCoPilot({
  context,
  data,
  variant = "floating",
  onApply,
}: AiCoPilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<
    "idle" | "submitted" | "error"
  >("idle");
  const [copied, setCopied] = useState(false);

  // [NEURAL GRID] Feedback Tracking
  const [feedbackAction, setFeedbackAction] = useState<
    "THUMBS_UP" | "THUMBS_DOWN" | null
  >(null);

  const fetchInsight = async () => {
    setLoading(true);
    setFeedbackStatus("idle");
    try {
      const response = await strategyService.getInsight({
        context,
        draftContent: JSON.stringify(data),
        contextType: data?.contextType === "ticket" ? "ticket" : "general",
        contextId:
          typeof data?.contextId === "string" ? data.contextId : undefined,
      });

      setInsight(response.insight || "No neural signals found.");
    } catch (e) {
      console.error("CoPilot failed:", e);
      setInsight("Neural link unstable. Unable to retrieve strategy.");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (
    action: "THUMBS_UP" | "THUMBS_DOWN" | "COPY",
  ) => {
    if (
      typeof data?.contextId !== "string" ||
      !data.contextId ||
      feedbackStatus === "submitted"
    )
      return;

    // Optimistic UI
    if (action === "THUMBS_UP" || action === "THUMBS_DOWN") {
      setFeedbackAction(action);
    }
    if (action === "COPY") {
      setCopied(true);
      navigator.clipboard.writeText(insight || "");
      setTimeout(() => setCopied(false), 2000);
    }

    try {
      await strategyService.recordFeedback({
        contextId: data.contextId,
        action,
        signalId: "latest-insight", // ideally this comes from backend response
      });

      if (action !== "COPY") setFeedbackStatus("submitted");
    } catch (e) {
      console.error("Feedback failed:", e);
      setFeedbackStatus("error");
    }
  };

  if (!isOpen) {
    return (
      <div
        className={cn("relative", variant === "inline" ? "inline-flex" : "")}
      >
        <Button
          aria-label="AI asistanını aç"
          onClick={() => {
            setIsOpen(true);
            // Load the first insight when the panel opens, not on every render.
            if (!insight) fetchInsight();
          }}
          className={cn(
            "rounded-full bg-[#9df425] hover:bg-[#9df425]/90 shadow-[0_0_20px_rgba(157,244,37,0.3)] z-50 flex items-center justify-center p-0 transition-transform hover:scale-110 active:scale-95",
            variant === "floating"
              ? "fixed bottom-6 right-6 h-12 w-12"
              : "h-8 w-8 relative shadow-none",
          )}
        >
          <BrainCircuit
            className={cn(
              "text-black",
              variant === "floating" ? "h-6 w-6" : "h-4 w-4",
            )}
          />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative", variant === "inline" ? "inline-flex" : "")}>
      <div
        className={cn(
          "bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200",
          variant === "floating"
            ? "fixed bottom-6 right-6 w-80 md:w-96"
            : "absolute top-0 right-0 w-80 z-[100]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#9df425] animate-pulse shadow-[0_0_8px_#9df425]" />
            <span className="font-mono text-[10px] font-bold text-[#9df425] tracking-widest uppercase">
              NEURAL_SYNAPSE_LINK
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Feedback Actions */}
            <div className="flex bg-white/5 rounded-lg p-0.5 mr-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 hover:bg-white/10",
                  feedbackAction === "THUMBS_UP" && "text-[#9df425]",
                )}
                aria-label="Öneri yararlı"
                onClick={() => handleFeedback("THUMBS_UP")}
                disabled={feedbackStatus === "submitted"}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 hover:bg-white/10",
                  feedbackAction === "THUMBS_DOWN" && "text-red-400",
                )}
                aria-label="Öneri yararsız"
                onClick={() => handleFeedback("THUMBS_DOWN")}
                disabled={feedbackStatus === "submitted"}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Asistanı kapat"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 min-h-[160px] flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-white/40">
              <BrainCircuit className="h-8 w-8 animate-pulse text-[#9df425]/50" />
              <span className="font-mono text-[10px] uppercase tracking-widest animate-pulse">
                Analyzing_Strategic_Vectors...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-[#ff8c00] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm mb-1">
                    Strategic Insight
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed font-sans">
                    {insight}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white/40 hover:text-white"
                  onClick={() => handleFeedback("COPY")}
                >
                  {copied ? (
                    <Check aria-hidden className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy aria-hidden className="h-3 w-3" />
                  )}
                  <span className="sr-only">
                    {copied ? "Kopyalandı" : "Öneriyi kopyala"}
                  </span>
                </Button>
              </div>

              <div className="pt-3 border-t border-white/5 flex gap-2">
                <Button
                  onClick={fetchInsight}
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-white/10 text-white/60 hover:text-white text-[10px] uppercase tracking-wider font-mono h-8"
                >
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (onApply && insight) {
                      onApply(insight);
                      setIsOpen(false);
                    }
                  }}
                  className="flex-1 bg-[#9df425] text-black hover:bg-[#9df425]/90 text-[10px] uppercase tracking-wider font-bold font-mono h-8"
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-black border-t border-white/10 flex justify-between items-center text-[9px] text-white/20 font-mono uppercase tracking-widest">
          <span>Processing Node: HULYAEKIZ-01</span>
          <span>Latency: ~12ms</span>
        </div>
      </div>
    </div>
  );
}

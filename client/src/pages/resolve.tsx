import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Brain, ChevronDown, Gavel, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { DeadlineTimeline } from "@/components/deadline-timeline";

interface Message {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
}

export default function ResolvePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalatedCaseId, setEscalatedCaseId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch("/api/resolve/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedThinking = "";
      let accumulatedContent = "";
      let isThinking = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "thinking_start") {
                  isThinking = true;
                } else if (data.type === "thinking" && data.content) {
                  accumulatedThinking += data.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: accumulatedContent,
                      thinking: accumulatedThinking,
                    };
                    return updated;
                  });
                } else if (data.type === "thinking_end") {
                  isThinking = false;
                } else if (data.type === "text_start") {
                  // text block starting
                } else if (data.content && !data.type) {
                  accumulatedContent += data.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      role: "assistant",
                      content: accumulatedContent,
                      thinking: accumulatedThinking,
                    };
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "I'm sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const escalateToCourtHandler = async () => {
    setIsEscalating(true);
    try {
      const firstUserMessage = messages.find(m => m.role === "user");
      const allContent = messages.map(m => m.content).join("\n");
      
      // Try to extract a name from user messages
      const nameMatch = allContent.match(/(?:my name is|i am|i'm)\s+([A-Z][a-z]+ [A-Z][a-z]+)/i);
      const applicantName = nameMatch ? nameMatch[1] : "Complainant";
      
      // Detect offense type from conversation
      const lowerContent = allContent.toLowerCase();
      let offenseType = "Civil Dispute";
      if (lowerContent.includes("138") || lowerContent.includes("cheque") || lowerContent.includes("bounce")) {
        offenseType = "S.138 NI Act (Cheque Dishonour)";
      } else if (lowerContent.includes("consumer") || lowerContent.includes("defective")) {
        offenseType = "Consumer Protection Act 2019";
      } else if (lowerContent.includes("rent") || lowerContent.includes("tenant") || lowerContent.includes("landlord")) {
        offenseType = "Rental Dispute (Model Tenancy Act)";
      }
      
      // Build summary from the conversation
      const summary = messages.slice(0, 6).map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content.slice(0, 500)}`).join("\n\n");

      const res = await fetch("/api/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantName,
          offenseType,
          summary,
        }),
      });

      if (!res.ok) throw new Error("Escalation failed");
      const caseData = await res.json();
      setEscalated(true);
      setEscalatedCaseId(caseData.id);
    } catch (error) {
      console.error("Escalation failed:", error);
    } finally {
      setIsEscalating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      <SEO
        title="Resolve Dispute - CLAUSE"
        description="Resolve cheque bounce and legal disputes with AI-powered analysis. Get instant deadlines under Section 138 NI Act, draft demand notices, and settlement proposals."
      />

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
          <div className="text-center space-y-6 max-w-md">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight" data-testid="text-resolve-heading">
                Resolve your dispute
              </h2>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-resolve-subtitle">
                Describe your cheque bounce or legal dispute. I'll calculate your deadlines under Section 138 NI Act, draft your demand notice, and propose a fair settlement.
              </p>
            </div>

            <div className="space-y-2 text-left">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" data-testid="text-examples-label">Try saying</p>
              {[
                "I received a cheque of ₹3 lakh that bounced 2 weeks ago",
                "I sent a legal notice for a bounced cheque but the 15-day period just expired and they haven't paid",
                "Someone gave me a cheque for ₹50,000 that was returned for insufficient funds",
              ].map((example, idx) => (
                <button
                  key={example}
                  onClick={() => {
                    setInput(example);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left px-4 py-3 rounded-md border text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid={`button-example-${idx}`}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3"
                      : "text-foreground"
                  }`}
                  data-testid={`message-${msg.role}-${i}`}
                >
                  {msg.role === "assistant" ? (
                    <div>
                      {msg.thinking && <ThinkingBlock thinking={msg.thinking} />}
                      <div className="prose prose-sm max-w-none">
                        <AssistantContent content={msg.content} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
              {msg.role === "assistant" && i === 1 && msg.content && !isStreaming && isChequeBounceTopic(messages) && (
                <div className="max-w-[85%] mt-3">
                  <DeadlineTimeline chequeDate={extractChequeDate(messages)} />
                </div>
              )}
            </div>
          ))}
          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start" data-testid="status-streaming">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {messages[messages.length - 1]?.thinking ? "Reasoning..." : "Thinking..."}
                </span>
              </div>
            </div>
          )}
          {messages.length >= 2 && !isStreaming && !escalated && (
            <div className="flex justify-start px-1 py-2" data-testid="escalate-section">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/50 border border-border/50 max-w-[85%]">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Settlement not working?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Escalate to court. Your case details will appear on the judge's docket.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={escalateToCourtHandler}
                  disabled={isEscalating}
                  data-testid="button-escalate"
                  className="shrink-0 gap-2"
                >
                  {isEscalating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Gavel className="w-4 h-4" />
                  )}
                  File in Court
                </Button>
              </div>
            </div>
          )}
          {escalated && escalatedCaseId && (
            <div className="flex justify-start px-1 py-2" data-testid="escalated-confirmation">
              <div className="px-4 py-3 rounded-lg bg-primary/10 border border-primary/20 max-w-[85%] space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Case filed in court</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your dispute has been added to the magistrate's docket as Case #{escalatedCaseId.toString().padStart(4, "0")}.
                </p>
                <Link href={`/bench/${escalatedCaseId}`}>
                  <Button variant="outline" size="sm" className="gap-2 mt-1" data-testid="button-view-case">
                    <Gavel className="w-3.5 h-3.5" />
                    View on Judge's Bench
                  </Button>
                </Link>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="sticky bottom-0 bg-background border-t border-border/50 px-4 py-3">
        <div className="max-w-3xl mx-auto relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your legal situation..."
            className="resize-none pr-12 text-sm min-h-[48px] max-h-[200px] rounded-xl border-input"
            rows={1}
            disabled={isStreaming}
            data-testid="input-message"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 rounded-lg"
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ThinkingBlock({ thinking }: { thinking: string }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!thinking) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover-elevate active-elevate-2 px-2 py-1.5 rounded-md transition-colors"
        data-testid="button-toggle-thinking"
      >
        <Brain className="w-3.5 h-3.5" />
        <span>{isOpen ? "Hide" : "View"} legal reasoning</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="mt-2 pl-3 border-l-2 border-primary/20 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-thinking-content">
          {thinking}
        </div>
      )}
    </div>
  );
}

function AssistantContent({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: JSX.Element[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <h3 key={i} className="font-semibold text-foreground mt-4 mb-1 text-sm">
          {trimmed.replace(/\*\*/g, "")}
        </h3>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <p key={i} className="text-sm text-foreground/90 pl-3 py-0.5 leading-relaxed flex gap-2">
          <span className="text-muted-foreground shrink-0">-</span>
          <span>{formatInlineBold(trimmed.slice(2))}</span>
        </p>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\.\s/)?.[1];
      elements.push(
        <p key={i} className="text-sm text-foreground/90 pl-3 py-0.5 leading-relaxed flex gap-2">
          <span className="text-muted-foreground shrink-0">{num}.</span>
          <span>{formatInlineBold(trimmed.replace(/^\d+\.\s/, ""))}</span>
        </p>
      );
    } else if (trimmed === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-foreground/90 leading-relaxed">
          {formatInlineBold(trimmed)}
        </p>
      );
    }
  });

  return <>{elements}</>;
}

function formatInlineBold(text: string): (string | JSX.Element)[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function isChequeBounceTopic(messages: Message[]): boolean {
  const allText = messages.map(m => m.content).join(" ").toLowerCase();
  return allText.includes("138") || allText.includes("cheque") || allText.includes("bounce") || allText.includes("ni act") || allText.includes("demand notice");
}

function extractChequeDate(messages: Message[]): Date | undefined {
  const userMessages = messages.filter(m => m.role === "user");
  const text = userMessages.map(m => m.content).join(" ").toLowerCase();

  const weeksAgoMatch = text.match(/(\d+)\s*weeks?\s*ago/);
  if (weeksAgoMatch) {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(weeksAgoMatch[1]) * 7);
    return d;
  }

  const daysAgoMatch = text.match(/(\d+)\s*days?\s*ago/);
  if (daysAgoMatch) {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(daysAgoMatch[1]));
    return d;
  }

  const monthsAgoMatch = text.match(/(\d+)\s*months?\s*ago/);
  if (monthsAgoMatch) {
    const d = new Date();
    d.setMonth(d.getMonth() - parseInt(monthsAgoMatch[1]));
    return d;
  }

  return undefined;
}

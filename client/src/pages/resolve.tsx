import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Brain, ChevronDown, Gavel, Check, FileText, Paperclip, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { DeadlineTimeline } from "@/components/deadline-timeline";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  attachments?: { name: string; type: string; content: string; preview?: string }[];
}

function parseInteractiveQuestion(content: string) {
  const pattern = /---QUESTION---\s*([\s\S]*?)\s*---OPTIONS---\s*([\s\S]*?)\s*---END---/;
  const match = content.match(pattern);
  if (!match) return null;

  const fullMatch = match[0];
  const questionText = match[1].trim();
  const optionsRaw = match[2].trim();
  const options = optionsRaw.split("\n").map(o => o.trim()).filter(o => o.length > 0);

  const idx = content.indexOf(fullMatch);
  const beforeQuestion = content.slice(0, idx).trim();
  const afterQuestion = content.slice(idx + fullMatch.length).trim();

  return { beforeQuestion, questionText, options, afterQuestion };
}

function stripInteractiveMarkers(content: string): string {
  return content
    .replace(/---QUESTION---/g, "")
    .replace(/---OPTIONS---/g, "")
    .replace(/---END---/g, "")
    .replace(/-{1,2}(?:QUESTION|OPTIONS|END)-{0,3}$/g, "")
    .trim();
}

const markdownComponents = {
  h1: ({ children, ...props }: any) => <h1 className="text-lg font-semibold text-foreground mt-4 mb-2" {...props}>{children}</h1>,
  h2: ({ children, ...props }: any) => <h2 className="text-base font-semibold text-foreground mt-4 mb-2" {...props}>{children}</h2>,
  h3: ({ children, ...props }: any) => <h3 className="text-sm font-semibold text-foreground mt-3 mb-1" {...props}>{children}</h3>,
  p: ({ children, ...props }: any) => <p className="text-sm text-foreground/90 leading-relaxed mb-2" {...props}>{children}</p>,
  ul: ({ children, ...props }: any) => <ul className="text-sm text-foreground/90 list-disc pl-4 space-y-1 mb-2" {...props}>{children}</ul>,
  ol: ({ children, ...props }: any) => <ol className="text-sm text-foreground/90 list-decimal pl-4 space-y-1 mb-2" {...props}>{children}</ol>,
  li: ({ children, ...props }: any) => <li className="leading-relaxed" {...props}>{children}</li>,
  strong: ({ children, ...props }: any) => <strong className="font-semibold text-foreground" {...props}>{children}</strong>,
  a: ({ children, ...props }: any) => <a className="text-primary underline" {...props}>{children}</a>,
  code: ({ node, children, className, ...props }: any) => {
    const isBlock = className?.includes("language-");
    if (!isBlock) {
      return <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props}>{children}</code>;
    }
    return <code className={className} {...props}>{children}</code>;
  },
  pre: ({ children, ...props }: any) => <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs mb-2" {...props}>{children}</pre>,
  table: ({ children, ...props }: any) => <table className="w-full border-collapse text-sm mb-2" {...props}>{children}</table>,
  thead: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  th: ({ children, ...props }: any) => <th className="border border-border px-3 py-1.5 text-left font-medium bg-muted/50" {...props}>{children}</th>,
  td: ({ children, ...props }: any) => <td className="border border-border px-3 py-1.5" {...props}>{children}</td>,
  blockquote: ({ children, ...props }: any) => <blockquote className="border-l-2 border-primary/30 pl-3 italic text-muted-foreground text-sm mb-2" {...props}>{children}</blockquote>,
};

function MarkdownContent({ content }: { content: string }) {
  if (!content) return null;

  const legalNoticePattern = /(?:^|\n)((?:LEGAL\s*NOTICE|DEMAND\s*NOTICE|NOTICE\s*UNDER\s*SECTION)[\s\S]*?)(?=\n\n(?:[A-Z]|$)|$)/i;
  const noticeMatch = content.match(legalNoticePattern);

  let beforeNotice = content;
  let noticeContent: string | null = null;
  let afterNotice = "";

  if (noticeMatch && noticeMatch[1] && noticeMatch[1].length > 100) {
    const idx = content.indexOf(noticeMatch[1]);
    beforeNotice = content.slice(0, idx);
    noticeContent = noticeMatch[1].trim();
    afterNotice = content.slice(idx + noticeMatch[1].length);
  }

  return (
    <>
      {beforeNotice && (
        <div className="text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {beforeNotice}
          </ReactMarkdown>
        </div>
      )}
      {noticeContent && <LegalDocumentPreview content={noticeContent} />}
      {afterNotice && (
        <div className="text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {afterNotice}
          </ReactMarkdown>
        </div>
      )}
    </>
  );
}

function InteractiveMessage({ content, onOptionSelect }: { content: string; onOptionSelect: (option: string) => void }) {
  const parsed = parseInteractiveQuestion(content);

  if (!parsed) {
    return <MarkdownContent content={content} />;
  }

  return (
    <div>
      {parsed.beforeQuestion && <MarkdownContent content={parsed.beforeQuestion} />}
      <div className="mt-3 space-y-3" data-testid="interactive-question">
        <div className="text-sm font-medium text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {parsed.questionText}
          </ReactMarkdown>
        </div>
        <div className="flex flex-col gap-2">
          {parsed.options.map((option, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="justify-start text-left text-sm whitespace-normal h-auto py-2.5 px-4"
              onClick={() => onOptionSelect(option)}
              data-testid={`button-option-${idx}`}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>
      {parsed.afterQuestion && <MarkdownContent content={parsed.afterQuestion} />}
    </div>
  );
}

export default function ResolvePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalatedCaseId, setEscalatedCaseId] = useState<number | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<{ name: string; type: string; content: string; preview?: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch("/api/resolve/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        return;
      }

      const attachment = await res.json();
      setPendingAttachments(prev => [...prev, attachment]);
      toast({ title: "File attached", description: `${attachment.name} ready to send` });
    } catch (error) {
      toast({ title: "Upload failed", description: "Something went wrong", variant: "destructive" });
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessageWithContent = async (content: string) => {
    if ((!content.trim() && pendingAttachments.length === 0) || isStreaming) return;

    const userMessage: Message = {
      role: "user",
      content: content.trim() || (pendingAttachments.length > 0 ? `I've uploaded: ${pendingAttachments.map(a => a.name).join(", ")}. Please analyze these documents.` : ""),
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setPendingAttachments([]);
    setIsStreaming(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch("/api/resolve/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedThinking = "";
      let accumulatedContent = "";
      let isThinkingBlock = false;

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
                  isThinkingBlock = true;
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
                  isThinkingBlock = false;
                } else if (data.type === "text_start") {
                  // text block starting
                } else if (data.content && (data.type === "text" || !data.type)) {
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

  const sendMessage = async () => {
    await sendMessageWithContent(input);
  };

  const escalateToCourtHandler = async () => {
    setIsEscalating(true);
    try {
      const firstUserMessage = messages.find(m => m.role === "user");
      const allContent = messages.map(m => m.content).join("\n");
      
      const nameMatch = allContent.match(/(?:my name is|i am|i'm)\s+([A-Z][a-z]+ [A-Z][a-z]+)/i);
      const applicantName = nameMatch ? nameMatch[1] : "Complainant";
      
      const lowerContent = allContent.toLowerCase();
      let offenseType = "Civil Dispute";
      if (lowerContent.includes("138") || lowerContent.includes("cheque") || lowerContent.includes("bounce")) {
        offenseType = "S.138 NI Act (Cheque Dishonour)";
      } else if (lowerContent.includes("consumer") || lowerContent.includes("defective")) {
        offenseType = "Consumer Protection Act 2019";
      } else if (lowerContent.includes("rent") || lowerContent.includes("tenant") || lowerContent.includes("landlord")) {
        offenseType = "Rental Dispute (Model Tenancy Act)";
      }
      
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
  const lastAssistantIndex = messages.reduce((acc, msg, idx) => msg.role === "assistant" ? idx : acc, -1);

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
              <div className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-primary" fill="currentColor" data-testid="icon-sparkle">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <h2 className="text-2xl font-semibold tracking-tight" data-testid="text-resolve-heading">
                  Resolve your dispute
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-resolve-subtitle">
                Describe your dispute or upload documents — cheque images, bank memos, legal notices. I'll analyze them, calculate your deadlines, draft your demand notice, and guide you step by step.
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
                  className="w-full text-left px-4 py-3 rounded-md border border-border text-sm text-foreground hover-elevate active-elevate-2 transition-colors"
                  data-testid={`button-example-${idx}`}
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                data-testid="button-upload-hint"
              >
                <Paperclip className="w-4 h-4" />
                <span>Or upload a cheque image, bank memo, or legal notice</span>
              </button>
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
                      {i === lastAssistantIndex && !isStreaming ? (
                        <InteractiveMessage
                          content={msg.content}
                          onOptionSelect={(option) => sendMessageWithContent(option)}
                        />
                      ) : (
                        <MarkdownContent content={stripInteractiveMarkers(msg.content)} />
                      )}
                    </div>
                  ) : (
                    <div>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {msg.attachments.map((att, aidx) => (
                            <div key={aidx} className="flex items-center gap-1.5 text-xs opacity-90">
                              {att.type === "image" ? (
                                <img src={att.content} alt={att.name} className="w-16 h-16 rounded object-cover border border-primary-foreground/20" />
                              ) : (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-primary-foreground/10">
                                  <FileText className="w-3 h-3" />
                                  <span className="truncate max-w-[100px]">{att.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
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
              <ThinkingIndicator hasThinking={!!messages[messages.length - 1]?.thinking} />
            </div>
          )}
          {messages.length >= 2 && !isStreaming && !escalated && (
            <div className="flex justify-start px-1 py-2" data-testid="escalate-section">
              <div className="flex items-center gap-3 px-4 py-3 rounded-md border border-border bg-card max-w-[85%]">
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
              <div className="px-4 py-3 rounded-md border border-primary/20 bg-card max-w-[85%] space-y-2">
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

      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3">
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 max-w-3xl mx-auto" data-testid="pending-attachments">
            {pendingAttachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-card text-xs" data-testid={`attachment-${idx}`}>
                {att.type === "image" ? (
                  <img src={att.content} alt={att.name} className="w-8 h-8 rounded object-cover" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-foreground truncate max-w-[120px]">{att.name}</span>
                <button
                  onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-foreground ml-1"
                  data-testid={`button-remove-attachment-${idx}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.jpg,.jpeg,.png,.webp,.gif"
            className="hidden"
            onChange={handleFileSelect}
            data-testid="input-file-upload"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-attach-file"
            className="shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your legal situation..."
            className="resize-none text-sm min-h-[48px] max-h-[200px] rounded-xl border-input flex-1"
            rows={1}
            disabled={isStreaming}
            data-testid="input-message"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={(!input.trim() && pendingAttachments.length === 0) || isStreaming}
            className="rounded-lg shrink-0"
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const thinkingLabels = [
  "Analyzing applicable Indian law...",
  "Reviewing Section 138 NI Act...",
  "Calculating limitation periods...",
  "Examining relevant precedents...",
  "Assessing legal position...",
  "Evaluating settlement options...",
];

function ThinkingIndicator({ hasThinking }: { hasThinking: boolean }) {
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    if (!hasThinking) return;
    const interval = setInterval(() => {
      setLabelIndex((prev) => (prev + 1) % thinkingLabels.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [hasThinking]);

  return (
    <div className="rounded-md border border-border bg-card px-4 py-3 space-y-2 max-w-[300px]" data-testid="indicator-thinking">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 rounded-full animate-pulse-ring" />
          <div className="relative w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">
            {hasThinking ? "Deep reasoning" : "Thinking"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {hasThinking ? thinkingLabels[labelIndex] : "Preparing analysis..."}
          </p>
        </div>
      </div>
      {hasThinking && (
        <div className="h-1 bg-muted rounded-full">
          <div className="h-full bg-primary/40 rounded-full animate-shimmer" style={{ width: "100%" }} />
        </div>
      )}
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
        className="flex items-center gap-2 text-xs text-muted-foreground hover-elevate active-elevate-2 px-2 py-1.5 rounded-md transition-colors bg-muted/50"
        data-testid="button-toggle-thinking"
      >
        <Brain className="w-3.5 h-3.5 text-primary" />
        <span>{isOpen ? "Hide" : "View"} legal reasoning</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="mt-2 pl-3 border-l-2 border-primary/30 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-thinking-content">
          {thinking}
        </div>
      )}
    </div>
  );
}

function LegalDocumentPreview({ content }: { content: string }) {
  return (
    <div className="my-4 border border-border bg-card rounded-md" data-testid="card-legal-document">
      <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Legal Notice Draft</span>
        <Badge variant="outline" className="ml-auto text-[10px]">Draft</Badge>
      </div>
      <div className="px-6 py-5 font-serif text-sm leading-relaxed whitespace-pre-wrap text-foreground/90" data-testid="text-legal-document-content">
        {content}
      </div>
    </div>
  );
}

function AssistantContent({ content }: { content: string }) {
  if (!content) return null;

  const legalNoticePattern = /(?:^|\n)((?:LEGAL\s*NOTICE|DEMAND\s*NOTICE|NOTICE\s*UNDER\s*SECTION)[\s\S]*?)(?=\n\n(?:[A-Z]|$)|$)/i;
  const noticeMatch = content.match(legalNoticePattern);

  let beforeNotice = content;
  let noticeContent: string | null = null;
  let afterNotice = "";

  if (noticeMatch && noticeMatch[1] && noticeMatch[1].length > 100) {
    const idx = content.indexOf(noticeMatch[1]);
    beforeNotice = content.slice(0, idx);
    noticeContent = noticeMatch[1].trim();
    afterNotice = content.slice(idx + noticeMatch[1].length);
  }

  return (
    <>
      {beforeNotice && <FormattedText text={beforeNotice} keyPrefix="before" />}
      {noticeContent && <LegalDocumentPreview content={noticeContent} />}
      {afterNotice && <FormattedText text={afterNotice} keyPrefix="after" />}
    </>
  );
}

function FormattedText({ text, keyPrefix }: { text: string; keyPrefix: string }) {
  const lines = text.split("\n");
  const elements: JSX.Element[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      elements.push(
        <h3 key={`${keyPrefix}-${i}`} className="font-semibold text-foreground mt-4 mb-1 text-sm">
          {trimmed.replace(/\*\*/g, "")}
        </h3>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <p key={`${keyPrefix}-${i}`} className="text-sm text-foreground/90 pl-3 py-0.5 leading-relaxed flex gap-2">
          <span className="text-muted-foreground shrink-0">-</span>
          <span>{formatInlineBold(trimmed.slice(2))}</span>
        </p>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\.\s/)?.[1];
      elements.push(
        <p key={`${keyPrefix}-${i}`} className="text-sm text-foreground/90 pl-3 py-0.5 leading-relaxed flex gap-2">
          <span className="text-muted-foreground shrink-0">{num}.</span>
          <span>{formatInlineBold(trimmed.replace(/^\d+\.\s/, ""))}</span>
        </p>
      );
    } else if (trimmed === "") {
      elements.push(<div key={`${keyPrefix}-${i}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`${keyPrefix}-${i}`} className="text-sm text-foreground/90 leading-relaxed">
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

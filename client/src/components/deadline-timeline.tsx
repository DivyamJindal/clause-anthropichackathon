import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Send, Gavel } from "lucide-react";

interface DeadlineTimelineProps {
  chequeDate?: Date;
}

export function DeadlineTimeline({ chequeDate }: DeadlineTimelineProps) {
  const now = new Date();
  const baseDate = chequeDate || now;
  
  const deadlines = [
    {
      label: "Send Legal Notice",
      days: 30,
      icon: Send,
      description: "Within 30 days of return memo",
    },
    {
      label: "Payment Window",
      days: 45,
      icon: Clock,
      description: "15 days for drawer to pay after receiving notice",
    },
    {
      label: "File Complaint",
      days: 75,
      icon: Gavel,
      description: "Within 30 days after payment window expires",
    },
  ];

  return (
    <Card className="p-4 my-3 space-y-3" data-testid="card-deadline-timeline">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-primary" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" data-testid="text-timeline-header">
          Section 138 Timeline
        </p>
      </div>

      <div className="relative">
        <div className="h-1.5 bg-muted rounded-full w-full" />
        
        <div className="flex justify-between gap-2 mt-3">
          {deadlines.map((d, i) => {
            const targetDate = new Date(baseDate);
            targetDate.setDate(targetDate.getDate() + d.days);
            const daysLeft = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isPast = daysLeft < 0;
            const isUrgent = daysLeft >= 0 && daysLeft <= 7;
            const Icon = d.icon;

            return (
              <div key={i} className="flex flex-col items-center text-center flex-1" data-testid={`deadline-${i}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  isPast ? "bg-destructive/10 border-destructive/30" :
                  isUrgent ? "bg-yellow-500/10 border-yellow-500/30" :
                  "bg-primary/10 border-primary/30"
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${
                    isPast ? "text-destructive" :
                    isUrgent ? "text-yellow-600 dark:text-yellow-400" :
                    "text-primary"
                  }`} />
                </div>
                <p className="text-xs font-medium text-foreground mt-2" data-testid={`text-deadline-label-${i}`}>{d.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5" data-testid={`text-deadline-desc-${i}`}>{d.description}</p>
                <Badge
                  variant={isPast ? "destructive" : isUrgent ? "outline" : "secondary"}
                  className="mt-1.5 text-[10px]"
                  data-testid={`badge-deadline-${i}`}
                >
                  {isPast ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

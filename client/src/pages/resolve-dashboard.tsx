import { useState } from "react";
import { useDisputes, useCreateDispute } from "@/hooks/use-disputes";
import { Link, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, ArrowRight, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function ResolveDashboard() {
  const { data: disputes, isLoading } = useDisputes();
  const createDispute = useCreateDispute();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    description: "",
    type: "cheque_bounce",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newDispute = await createDispute.mutateAsync(formData);
      setIsDialogOpen(false);
      // Navigate to the newly created dispute to see analysis
      setLocation(`/resolve/${newDispute.id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "analyzed": return "success";
      case "notice_sent": return "secondary";
      case "court_filed": return "destructive";
      default: return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-12 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
            AI-Powered Legal Resolution
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight">
            Resolve Disputes <span className="text-accent italic">Faster</span> Without Court
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Instantly analyze your legal standing, draft notices, and get expert guidance for civil disputes.
          </p>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 mt-4 shadow-lg shadow-accent/20">
                <Plus className="mr-2 w-5 h-5" />
                Start New Dispute
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">New Dispute Intake</DialogTitle>
                <DialogDescription>
                  Describe your situation briefly. Our AI will analyze the legal implications.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Dispute Type</Label>
                  <select 
                    id="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="cheque_bounce">Cheque Bounce (Section 138)</option>
                    <option value="rental_dispute">Rental Agreement Dispute</option>
                    <option value="contract_breach">Breach of Contract</option>
                    <option value="consumer_complaint">Consumer Complaint</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">What happened?</Label>
                  <Textarea
                    id="description"
                    placeholder="E.g. I received a cheque for $5000 from John Doe which bounced on Jan 15th..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="min-h-[120px]"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createDispute.isPending}
                >
                  {createDispute.isPending ? "Analyzing..." : "Analyze Dispute"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3" />
      </section>

      {/* Disputes List */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-semibold">Your Disputes</h2>
          <span className="text-sm text-muted-foreground">{disputes?.length || 0} active</span>
        </div>

        {disputes?.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No disputes found</h3>
            <p className="text-muted-foreground mt-1">Create your first dispute to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disputes?.map((dispute, idx) => (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link href={`/resolve/${dispute.id}`}>
                  <Card hover className="h-full flex flex-col cursor-pointer group">
                    <CardHeader className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant={getStatusColor(dispute.status) as any} className="uppercase text-[10px] tracking-wider">
                          {dispute.status.replace('_', ' ')}
                        </Badge>
                        {dispute.createdAt && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors line-clamp-1">
                        {dispute.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-2">
                        {dispute.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">View Analysis</span>
                      <div className="p-1.5 rounded-full bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

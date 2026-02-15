import { useCases, useCreateCase } from "@/hooks/use-cases";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Gavel, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function BenchDashboard() {
  const { data: cases, isLoading } = useCases();

  if (isLoading) return <div className="p-8">Loading docket...</div>;

  return (
    <div className="space-y-6">
      {/* Bench Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Judicial Docket</h1>
          <p className="text-slate-500">Bail Applications & Preliminary Hearings</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            New Case Entry
          </Button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by Case No, Name, or Offense..." className="pl-10" />
        </div>
        <Card className="bg-slate-50 border-slate-200 p-4 flex flex-col justify-center">
          <span className="text-xs text-slate-500 uppercase font-semibold">Pending Review</span>
          <span className="text-2xl font-bold text-slate-800">{cases?.length || 0}</span>
        </Card>
        <Card className="bg-amber-50 border-amber-100 p-4 flex flex-col justify-center">
          <span className="text-xs text-amber-600 uppercase font-semibold">Urgent (Over 6mo)</span>
          <span className="text-2xl font-bold text-amber-700">
            {cases?.filter(c => c.detentionMonths > 6).length || 0}
          </span>
        </Card>
      </div>

      {/* Case Grid */}
      <div className="grid gap-4">
        {cases?.map((c, idx) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link href={`/bench/${c.id}`}>
              <div className="group bg-white rounded-lg border p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col md:flex-row gap-4 items-center">
                <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <FileText className="w-6 h-6 text-slate-600" />
                </div>
                
                <div className="flex-1 min-w-0 grid md:grid-cols-4 gap-4 w-full">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">CASE #{c.id.toString().padStart(4, '0')}</p>
                    <h3 className="font-semibold text-slate-900 truncate">{c.applicantName}</h3>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Offense</p>
                    <p className="text-sm font-medium truncate">{c.offenseType}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground">Custody Period</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{c.detentionMonths} Months</span>
                      {c.detentionMonths > 6 && (
                        <Badge variant="warning" className="text-[10px] px-1 py-0 h-5">Extended</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <Badge variant={c.status === 'analyzed' ? 'outline' : 'secondary'}>
                      {c.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="hidden md:block text-slate-300">
                  <Gavel className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {cases?.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-lg border border-dashed">
            <p className="text-slate-500">No active cases in the docket.</p>
          </div>
        )}
      </div>
    </div>
  );
}

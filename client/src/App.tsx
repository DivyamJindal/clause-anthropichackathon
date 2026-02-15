import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import NotFound from "@/pages/not-found";

import ResolveDashboard from "@/pages/resolve-dashboard";
import DisputeDetail from "@/pages/dispute-detail";
import BenchDashboard from "@/pages/bench-dashboard";
import CaseDetail from "@/pages/case-detail";

function Router() {
  return (
    <Switch>
      {/* Resolve (Citizen) Routes */}
      <Route path="/" component={ResolveDashboard} />
      <Route path="/resolve/:id" component={DisputeDetail} />
      
      {/* Bench (Judiciary) Routes */}
      <Route path="/bench" component={BenchDashboard} />
      <Route path="/bench/:id" component={CaseDetail} />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

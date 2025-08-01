import { Route, Switch } from "wouter"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Ride from "@/pages/ride";
import Admin from "@/pages/admin";
import Results from "@/pages/results";
import RideResults from "@/pages/ride-results";
import NotFound from "@/pages/not-found";

// Create query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/rent" component={Home} />
      <Route path="/ride" component={Ride} />
      <Route path="/admin" component={Admin} />
      <Route path="/results" component={Results} />
      <Route path="/ride-results" component={RideResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
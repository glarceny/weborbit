import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CatalogPage from "@/pages/catalog";
import CheckoutPage from "@/pages/checkout";
import ClientAreaPage from "@/pages/client-area";
import StatusPage from "@/pages/status";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CatalogPage} />
      <Route path="/checkout/:productId" component={CheckoutPage} />
      <Route path="/client/:orderId" component={ClientAreaPage} />
      <Route path="/status" component={StatusPage} />
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

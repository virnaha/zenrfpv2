import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UnifiedRFPWorkflow } from "@/components/UnifiedRFPWorkflow";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { NavigationProvider, Header } from "@/components/Navigation";
import { NotFound } from "@/pages/NotFound";
import { Help } from "@/pages/Help";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <NavigationProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-black focus:text-white focus:px-3 focus:py-2 focus:rounded"
          >
            Skip to main content
          </a>
          <Toaster />
          <Sonner />

          <div className="min-h-screen bg-background">
            <Header />
            <main id="main">
              <Routes>
                <Route path="/" element={<UnifiedRFPWorkflow />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/help" element={<Help />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </NavigationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
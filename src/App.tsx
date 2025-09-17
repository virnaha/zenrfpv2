import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UnifiedRFPWorkflow } from "@/components/UnifiedRFPWorkflow";
import { KnowledgeBase } from "@/components/KnowledgeBase";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-black focus:text-white focus:px-3 focus:py-2 focus:rounded"
      >
        Skip to main content
      </a>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UnifiedRFPWorkflow />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><h1 className="text-2xl text-slate-900">Page Not Found</h1></div>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
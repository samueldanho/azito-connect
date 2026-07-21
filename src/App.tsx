import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { lazy, Suspense, useEffect, useState } from "react";
import Preloader from "@/components/shared/Preloader";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Members = lazy(() => import("./pages/Members"));
const Presences = lazy(() => import("./pages/Presences"));
const Services = lazy(() => import("./pages/Services"));
const Statistics = lazy(() => import("./pages/Statistics"));
const Settings = lazy(() => import("./pages/Settings"));
const Responsables = lazy(() => import("./pages/Responsables"));
const Comptes = lazy(() => import("./pages/Comptes"));
const Logs = lazy(() => import("./pages/Logs"));
const Register = lazy(() => import("./pages/Register"));
const BusCenter = lazy(() => import("./pages/BusCenter"));
const BusCenterDashboard = lazy(() => import("./pages/BusCenterDashboard"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const ScanPresence = lazy(() => import("./pages/ScanPresence"));
const AideCamera = lazy(() => import("./pages/AideCamera"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    // Brief initial preloader so logo + branding are seen on first paint
    const t = setTimeout(() => setAppLoading(false), 600);
    // Hide the static HTML preloader (if present)
    const initial = document.getElementById("initial-preloader");
    if (initial) initial.remove();
    return () => clearTimeout(t);
  }, []);

  if (appLoading) {
    return <Preloader message="Initialisation de l'application..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<Preloader message="Chargement de la page..." />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/inscription" element={<Register />} />
                <Route path="/bus-center" element={<BusCenter />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["berger", "responsable_service"]}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/membres"
                  element={
                    <ProtectedRoute allowedRoles={["berger", "responsable_service"]}>
                      <Members />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/presences"
                  element={
                    <ProtectedRoute allowedRoles={["berger", "responsable_service"]}>
                      <Presences />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/services"
                  element={
                    <ProtectedRoute allowedRoles={["berger"]}>
                      <Services />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/statistiques"
                  element={
                    <ProtectedRoute allowedRoles={["berger", "responsable_service"]}>
                      <Statistics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/parametres"
                  element={
                    <ProtectedRoute allowedRoles={["berger", "responsable_service"]}>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/responsables"
                  element={
                    <ProtectedRoute allowedRoles={["berger"]}>
                      <Responsables />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/comptes"
                  element={
                    <ProtectedRoute allowedRoles={["berger"]}>
                      <Comptes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/logs"
                  element={
                    <ProtectedRoute allowedRoles={["berger"]}>
                      <Logs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/bus-center"
                  element={
                    <ProtectedRoute allowedRoles={["berger", "responsable_service"]}>
                      <BusCenterDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/scan-presence"
                  element={
                    <ProtectedRoute allowedRoles={["berger", "responsable_service"]}>
                      <ScanPresence />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/aide-camera"
                  element={
                    <ProtectedRoute allowedRoles={["berger", "responsable_service"]}>
                      <AideCamera />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ThemeProvider from "./components/theme/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Bonds from "./pages/Bonds";
import NewBond from "./pages/NewBond";
import EditBond from "./pages/EditBond";
import BondDetail from "./pages/BondDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import RoleBasedRoute from "./components/RoleBasedRoute";
import Marketplace from "./pages/Marketplace";
import Portfolio from "./pages/Portfolio";
import Notifications from "./pages/Notification";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Rutas para Emisores */}
              <Route path="/bonds" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["issuer", "admin"]}>
                    <Bonds />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/bonds/new" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["issuer", "admin"]}>
                    <NewBond />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/bonds/:id/edit" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["issuer", "admin"]}>
                    <EditBond />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/bonds/:id" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["issuer", "admin"]}>
                    <BondDetail />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              
              {/* Rutas para Inversionistas */}
              <Route path="/marketplace" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["investor", "admin"]}>
                    <Marketplace />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/portfolio" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["investor", "admin"]}>
                    <Portfolio />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />

              <Route path="/notifications" element={
                <ProtectedRoute>
                  <RoleBasedRoute allowedRoles={["investor", "admin"]}>
                    <Notifications />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

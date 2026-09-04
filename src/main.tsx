import "./global.css";

import { createRoot } from "react-dom/client";
import { Suspense, lazy } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./lib/i18n";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CatalogProvider } from "./contexts/CatalogContext";
import { AdminLayout } from "./components/AdminLayout";
import { Login } from "./pages/Login";

// Lazy load all pages
const QuickCheckout = lazy(() => import("./pages/QuickCheckout").then(m => ({ default: m.QuickCheckout })));
const Invoices = lazy(() => import("./pages/Invoices").then(m => ({ default: m.Invoices })));
const BarcodeLabels = lazy(() => import("./pages/BarcodeLabels").then(m => ({ default: m.BarcodeLabels })));
const FinancialReports = lazy(() => import("./pages/FinancialReports").then(m => ({ default: m.FinancialReports })));
const Products = lazy(() => import("./pages/Products").then(m => ({ default: m.Products })));
const Categories = lazy(() => import("./pages/Categories").then(m => ({ default: m.Categories })));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Customers = lazy(() => import("./pages/Customers").then(m => ({ default: m.Customers })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const Help = lazy(() => import("./pages/Help").then(m => ({ default: m.Help })));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ── Network Resilience: Auto-refetch on reconnect & window focus ──
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 2,
      staleTime: 30_000, // 30s cache freshness for high-latency links
      gcTime: 5 * 60 * 1000, // 5 min garbage collection
    },
    mutations: {
      retry: 1,
    },
  },
});

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  return (
    <>
      <AuthProvider>
        <CatalogProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#0a0f1a] text-slate-400">Loading...</div>}>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes - Wrapped in AdminLayout */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Navigate to="/invoices/quick-checkout" replace />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/invoices/quick-checkout" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <QuickCheckout />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/invoices" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Invoices />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/invoices/create" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Navigate to="/invoices/quick-checkout" replace />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              {/* Legacy routes redirect to centralized invoices list */}
              <Route path="/invoices/:id" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Navigate to="/invoices" replace />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/invoices/:id/edit" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Navigate to="/invoices" replace />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Products />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/products/barcode-labels" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <BarcodeLabels />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/product-category" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Categories />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/suppliers" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Suppliers />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Customers />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/financial-reports" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <FinancialReports />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/help" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <Help />
                  </AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={
                <ProtectedRoute>
                  <AdminLayout>
                    <NotFound />
                  </AdminLayout>
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </CatalogProvider>
      </AuthProvider>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="rounded-xl shadow-lg"
      />
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
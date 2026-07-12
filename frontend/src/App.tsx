import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import AppShell from './components/layout/AppShell';
import RoleGuard from './components/layout/RoleGuard';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VehiclesPage from './pages/VehiclesPage';
import DriversPage from './pages/DriversPage';
import TripsPage from './pages/TripsPage';
import MaintenancePage from './pages/MaintenancePage';
import FuelExpensesPage from './pages/FuelExpensesPage';
import ReportsPage from './pages/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — wrapped in AppShell */}
          <Route
            element={
              <RoleGuard>
                <AppShell />
              </RoleGuard>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route
              path="/vehicles"
              element={
                <RoleGuard roles={['FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']}>
                  <VehiclesPage />
                </RoleGuard>
              }
            />

            <Route
              path="/drivers"
              element={
                <RoleGuard roles={['FLEET_MANAGER', 'SAFETY_OFFICER']}>
                  <DriversPage />
                </RoleGuard>
              }
            />

            <Route
              path="/trips"
              element={
                <RoleGuard roles={['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']}>
                  <TripsPage />
                </RoleGuard>
              }
            />

            <Route
              path="/maintenance"
              element={
                <RoleGuard roles={['FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']}>
                  <MaintenancePage />
                </RoleGuard>
              }
            />

            <Route
              path="/fuel-expenses"
              element={
                <RoleGuard roles={['FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST']}>
                  <FuelExpensesPage />
                </RoleGuard>
              }
            />

            <Route
              path="/reports"
              element={
                <RoleGuard roles={['FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']}>
                  <ReportsPage />
                </RoleGuard>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}

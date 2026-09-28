import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppShell } from './components/layout/AppShell';
// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ForemenPage } from './pages/ForemenPage';
import { ChitGroupsPage } from './pages/ChitGroupsPage';
import { SubscribersPage } from './pages/SubscribersPage';
import { KycQueuePage } from './pages/KycQueuePage';
import { AuctionsPage } from './pages/AuctionsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { SuretiesPage } from './pages/SuretiesPage';
import { LedgerPage } from './pages/LedgerPage';
import { CompliancePage } from './pages/CompliancePage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
const ProtectedRoute = () => {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated) {
        return <Navigate to="/chit" replace/>;
    }
    return <AppShell />;
};
export const App = () => {
    return (<Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />}/>

      {/* Public Login Page */}
      <Route path="/chit" element={<LoginPage />}/>

      {/* Protected Admin Routes */}
      <Route path="/chit" element={<ProtectedRoute />}>
        <Route path="dashboard" element={<DashboardPage />}/>
        <Route path="foremen" element={<ForemenPage />}/>
        <Route path="groups" element={<ChitGroupsPage />}/>
        <Route path="subscribers" element={<SubscribersPage />}/>
        <Route path="kyc" element={<KycQueuePage />}/>
        <Route path="auctions" element={<AuctionsPage />}/>
        <Route path="payments" element={<PaymentsPage />}/>
        <Route path="sureties" element={<SuretiesPage />}/>
        <Route path="ledger" element={<LedgerPage />}/>
        <Route path="compliance" element={<CompliancePage />}/>
        <Route path="audit" element={<AuditLogsPage />}/>
        <Route path="settings" element={<SettingsPage />}/>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />}/>
    </Routes>);
};
export default App;

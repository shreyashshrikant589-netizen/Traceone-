import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import CasesPage from '../pages/CasesPage';
import CaseDetailPage from '../pages/CaseDetailPage';
import LoginPage from '../pages/LoginPage';
import LiveOperationsPage from '../pages/LiveOperationsPage';
import VolunteersPage from '../pages/VolunteersPage';
import TeamsPage from '../pages/TeamsPage';
import SearchZonesPage from '../pages/SearchZonesPage';
import AIPriorityPage from '../pages/AIPriorityPage';
import PublicReportsPage from '../pages/PublicReportsPage';
import PossibleMatchesPage from '../pages/PossibleMatchesPage';
import EscalationsPage from '../pages/EscalationsPage';
import PoliceNotificationsPage from '../pages/PoliceNotificationsPage';
import EvidencePage from '../pages/EvidencePage';
import AuditLogsPage from '../pages/AuditLogsPage';
import NotificationsPage from '../pages/NotificationsPage';
import SettingsPage from '../pages/SettingsPage';
import DashboardPage from '../pages/DashboardPage';
import { isAuthenticated } from '../services/authService';

const requireAuth = (element: React.ReactNode) => (isAuthenticated() ? element : <Navigate to="/login" replace />);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={requireAuth(<Navigate to="/dashboard" replace />)} />
        <Route path="/dashboard" element={requireAuth(<DashboardPage />)} />
        <Route path="/cases" element={requireAuth(<CasesPage />)} />
        <Route path="/cases/:caseId" element={requireAuth(<CaseDetailPage />)} />
        <Route path="/live-operations" element={requireAuth(<LiveOperationsPage />)} />
        <Route path="/search-ops" element={requireAuth(<DashboardPage />)} />
        <Route path="/volunteers" element={requireAuth(<VolunteersPage />)} />
        <Route path="/teams" element={requireAuth(<TeamsPage />)} />
        <Route path="/search-zones" element={requireAuth(<SearchZonesPage />)} />
        <Route path="/ai-priority" element={requireAuth(<AIPriorityPage />)} />
        <Route path="/public-reports" element={requireAuth(<PublicReportsPage />)} />
        <Route path="/possible-matches" element={requireAuth(<PossibleMatchesPage />)} />
        <Route path="/escalations" element={requireAuth(<EscalationsPage />)} />
        <Route path="/police-notifications" element={requireAuth(<PoliceNotificationsPage />)} />
        <Route path="/evidence" element={requireAuth(<EvidencePage />)} />
        <Route path="/audit-logs" element={requireAuth(<AuditLogsPage />)} />
        <Route path="/alerts" element={requireAuth(<DashboardPage />)} />
        <Route path="/reports" element={requireAuth(<DashboardPage />)} />
        <Route path="/notifications" element={requireAuth(<NotificationsPage />)} />
        <Route path="/settings" element={requireAuth(<SettingsPage />)} />
        <Route path="*" element={requireAuth(<Navigate to="/dashboard" replace />)} />
      </Route>
    </Routes>
  );
}

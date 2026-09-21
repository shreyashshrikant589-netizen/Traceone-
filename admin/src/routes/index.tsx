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

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:caseId" element={<CaseDetailPage />} />
        <Route path="/live-operations" element={<LiveOperationsPage />} />
        <Route path="/search-ops" element={<DashboardPage />} />
        <Route path="/volunteers" element={<VolunteersPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/search-zones" element={<SearchZonesPage />} />
        <Route path="/ai-priority" element={<AIPriorityPage />} />
        <Route path="/public-reports" element={<PublicReportsPage />} />
        <Route path="/possible-matches" element={<PossibleMatchesPage />} />
        <Route path="/escalations" element={<EscalationsPage />} />
        <Route path="/police-notifications" element={<PoliceNotificationsPage />} />
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/alerts" element={<DashboardPage />} />
        <Route path="/reports" element={<DashboardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

import LandingPage from "./app/page";
import CandidateApplyPage from "./app/(candidate)/apply/page";
import CandidateApplyDynamicPage from "./app/(candidate)/apply/[token]/page";
import InterviewTokenPage from "./app/(candidate)/apply/interview/[token]/page";
import CandidateProfilePage from "./app/(candidate)/profile/page";
import CandidateOffersPage from "./app/(candidate)/offers/page";
import DashboardPage from "./app/dashboard/page";
import JobPoolsPage from "./app/job-pools/page";
import JobPoolDetailPage from "./app/job-pools/[id]/page";
import RoleChooserPage from "./app/auth/RoleChooserPage";
import RoleAuthPage from "./app/auth/RoleAuthPage";
import RecruiterLayout from "./app/recruiter/layout";
import RecruiterDashboardPage from "./app/recruiter/dashboard/page";
import RecruiterApplicationsPage from "./app/recruiter/applications/page";
import RecruiterCompanyPage from "./app/recruiter/company/page";
import RecruiterSettingsPage from "./app/recruiter/settings/page";
import RecruiterDraftsPage from "./app/recruiter/drafts/page";
import RecruiterTalentPoolPage from "./app/recruiter/talent-pool/page";
import RecruiterInterviewsPage from "./app/recruiter/interviews/page";
import RecruiterAnalyticsPage from "./app/recruiter/analytics/page";
import RecruiterNotificationsPage from "./app/recruiter/notifications/page";
import CandidateLayout from "./app/candidate/layout";
import CandidateDashboardPage from "./app/candidate/dashboard/page";
import CandidateStatisticsPage from "./app/candidate/statistics/page";
import CandidateJobsPage from "./app/candidate/jobs/page";
import CandidateSettingsPage from "./app/candidate/settings/page";
import CandidateApplicationsPage from "./app/candidate/applications/page";
import CandidateInterviewsPage from "./app/candidate/interviews/page";
import CandidateInsightsPage from "./app/candidate/insights/page";
import CandidateRecommendedPage from "./app/candidate/recommended/page";
import CandidateNotificationsPage from "./app/candidate/notifications/page";
import CandidateResumePage from "./app/candidate/resume/page";
import AdminApp from "./admin/AdminApp";

import RootLayout from "./app/layout";

function RedirectToRecruiterJob() {
  const { id } = useParams();
  return <Navigate to={`/recruiter/jobs/${id}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/apply" element={<CandidateApplyPage />} />
          <Route path="/apply/:token" element={<CandidateApplyDynamicPage />} />
          <Route path="/apply/interview/:token" element={<InterviewTokenPage />} />
          <Route path="/offers" element={<CandidateOffersPage />} />

          {/* Candidate portal — shared DashboardShell */}
          <Route element={<CandidateLayout />}>
            <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
            <Route path="/candidate/statistics" element={<CandidateStatisticsPage />} />
            <Route path="/candidate/jobs" element={<CandidateJobsPage />} />
            <Route path="/candidate/recommended" element={<CandidateRecommendedPage />} />
            <Route path="/candidate/applications" element={<CandidateApplicationsPage />} />
            <Route path="/candidate/interviews" element={<CandidateInterviewsPage />} />
            <Route path="/candidate/resume" element={<CandidateResumePage />} />
            <Route path="/candidate/insights" element={<CandidateInsightsPage />} />
            <Route path="/candidate/notifications" element={<CandidateNotificationsPage />} />
            <Route path="/candidate/profile" element={<CandidateProfilePage />} />
            <Route path="/candidate/settings" element={<CandidateSettingsPage />} />
          </Route>

          {/* Unified auth gateway */}
          <Route path="/login" element={<RoleChooserPage mode="login" />} />
          <Route path="/get-started" element={<RoleChooserPage mode="register" />} />
          <Route path="/login/:role" element={<RoleAuthPage mode="login" />} />
          <Route path="/register/:role" element={<RoleAuthPage mode="register" />} />

          {/* Legacy auth routes → redirect into the unified gateway (kept working) */}
          <Route path="/recruiter/login" element={<Navigate to="/login/recruiter" replace />} />
          <Route path="/recruiter/register" element={<Navigate to="/register/recruiter" replace />} />
          <Route path="/admin/login" element={<Navigate to="/login/admin" replace />} />

          {/* Recruiter workspace — shared DashboardShell */}
          <Route element={<RecruiterLayout />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
            <Route path="/recruiter/jobs" element={<JobPoolsPage />} />
            <Route path="/recruiter/jobs/new" element={<JobPoolsPage autoCreate />} />
            <Route path="/recruiter/jobs/drafts" element={<RecruiterDraftsPage />} />
            <Route path="/recruiter/jobs/:id" element={<JobPoolDetailPage />} />
            <Route path="/recruiter/candidates" element={<DashboardPage />} />
            <Route path="/recruiter/candidates/matching" element={<DashboardPage />} />
            <Route path="/recruiter/candidates/pool" element={<RecruiterTalentPoolPage />} />
            <Route path="/recruiter/applications" element={<RecruiterApplicationsPage />} />
            <Route path="/recruiter/interviews" element={<RecruiterInterviewsPage />} />
            <Route path="/recruiter/analytics" element={<RecruiterAnalyticsPage />} />
            <Route path="/recruiter/notifications" element={<RecruiterNotificationsPage />} />
            <Route path="/recruiter/company" element={<RecruiterCompanyPage />} />
            <Route path="/recruiter/settings" element={<RecruiterSettingsPage />} />
          </Route>

          {/* Legacy recruiter routes → redirect into the workspace */}
          <Route path="/dashboard" element={<Navigate to="/recruiter/dashboard" replace />} />
          <Route path="/job-pools" element={<Navigate to="/recruiter/jobs" replace />} />
          <Route path="/job-pools/:id" element={<RedirectToRecruiterJob />} />

          {/* Admin module (self-contained MVC module under src/admin) */}
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </RootLayout>
    </BrowserRouter>
  );
}

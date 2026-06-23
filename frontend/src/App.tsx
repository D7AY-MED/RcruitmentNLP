import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./app/page";
import CandidateApplyPage from "./app/(candidate)/apply/page";
import CandidateApplyDynamicPage from "./app/(candidate)/apply/[token]/page";
import InterviewTokenPage from "./app/(candidate)/apply/interview/[token]/page";
import CandidateProfilePage from "./app/(candidate)/profile/page";
import DashboardPage from "./app/dashboard/page";
import JobPoolsPage from "./app/job-pools/page";
import JobPoolDetailPage from "./app/job-pools/[id]/page";
import RecruiterLoginPage from "./app/recruiter/login/page";
import RecruiterRegisterPage from "./app/recruiter/register/page";
import AdminLoginPage from "./app/admin/login/page";
import AdminDashboardPage from "./app/admin/page";
import AdminCandidatesPage from "./app/admin/candidates/page";
import AdminRecruitersPage from "./app/admin/recruiters/page";

import DashboardLayout from "./app/dashboard/layout";
import JobPoolsLayout from "./app/job-pools/layout";
import AdminLayout from "./app/admin/layout";
import RootLayout from "./app/layout";

export default function App() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/apply" element={<CandidateApplyPage />} />
          <Route path="/apply/:token" element={<CandidateApplyDynamicPage />} />
          <Route path="/apply/interview/:token" element={<InterviewTokenPage />} />
          <Route path="/profile" element={<CandidateProfilePage />} />
          <Route path="/recruiter/login" element={<RecruiterLoginPage />} />
          <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          
          <Route element={<JobPoolsLayout />}>
            <Route path="/job-pools" element={<JobPoolsPage />} />
            <Route path="/job-pools/:id" element={<JobPoolDetailPage />} />
          </Route>
          
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/candidates" element={<AdminCandidatesPage />} />
            <Route path="/admin/recruiters" element={<AdminRecruitersPage />} />
          </Route>
        </Routes>
      </RootLayout>
    </BrowserRouter>
  );
}

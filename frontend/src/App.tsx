import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./app/page";
import CandidateApplyPage from "./app/(candidate)/apply/page";
import CandidateApplyDynamicPage from "./app/(candidate)/apply/[token]/page";
import InterviewTokenPage from "./app/(candidate)/apply/interview/[token]/page";
import CandidateProfilePage from "./app/(candidate)/profile/page";
import CandidateOffersPage from "./app/(candidate)/offers/page";
import DashboardPage from "./app/dashboard/page";
import JobPoolsPage from "./app/job-pools/page";
import JobPoolDetailPage from "./app/job-pools/[id]/page";
import RecruiterLoginPage from "./app/recruiter/login/page";
import RecruiterRegisterPage from "./app/recruiter/register/page";
import AdminApp from "./admin/AdminApp";

import DashboardLayout from "./app/dashboard/layout";
import JobPoolsLayout from "./app/job-pools/layout";
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
          <Route path="/candidate/profile" element={<CandidateProfilePage />} />
          <Route path="/offers" element={<CandidateOffersPage />} />
          <Route path="/recruiter/login" element={<RecruiterLoginPage />} />
          <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          
          <Route element={<JobPoolsLayout />}>
            <Route path="/job-pools" element={<JobPoolsPage />} />
            <Route path="/job-pools/:id" element={<JobPoolDetailPage />} />
          </Route>
          
          {/* Admin module (self-contained MVC module under src/admin) */}
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </RootLayout>
    </BrowserRouter>
  );
}

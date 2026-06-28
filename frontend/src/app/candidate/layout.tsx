import { Navigate } from 'react-router-dom';
import { getToken } from '@/lib/candidateAuth';
import { CandidateShell } from './CandidateShell';

/** Candidate layout route: token guard + shared shell. */
export default function CandidateLayout() {
  if (!getToken()) return <Navigate to="/login/candidate" replace />;
  return <CandidateShell />;
}

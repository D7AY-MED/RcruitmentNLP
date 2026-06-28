import { loginRecruiter, registerRecruiter } from '@/lib/recruiterAuth';
import { loginCandidate, registerCandidate } from '@/lib/candidateAuth';
import { login as adminLogin } from '@/admin/services/auth.service';
import type { Role } from '../layout/types';

/**
 * roleAuth — the single bridge between the unified auth UI and the THREE
 * existing per-role backends. No backend/API changes: this only routes each
 * role's submit to its existing function and reports a post-auth home.
 *
 * Phase-1 homes intentionally use the CURRENTLY working routes so nothing
 * breaks before later phases build the new dashboards.
 */
export type AuthFields = {
  full_name?: string;
  email: string;
  password: string;
  phone?: string;
  company_name?: string;
};

export type ExtraField = 'full_name' | 'company_name' | 'phone';

export type RoleAuth = {
  label: string;
  /** short value line shown on the auth brand panel */
  blurb: string;
  canRegister: boolean;
  /** where to land after a successful login / register (Phase-1 safe targets) */
  loginHome: string;
  registerHome: string;
  login: (f: AuthFields) => Promise<unknown>;
  register?: (f: AuthFields) => Promise<unknown>;
  /** extra fields (beyond email + password) shown in register mode */
  registerFields: ExtraField[];
};

export const authConfig: Record<Role, RoleAuth> = {
  recruiter: {
    label: 'Recruteur',
    blurb: 'Publiez vos offres, classez les candidatures par matching sémantique et laissez l’IA mener vos premiers entretiens.',
    canRegister: true,
    loginHome: '/recruiter/dashboard',
    registerHome: '/recruiter/dashboard',
    login: ({ email, password }) => loginRecruiter(email, password),
    register: ({ full_name = '', email, password, company_name = '', phone }) =>
      registerRecruiter({ full_name, email, password, company_name, phone }),
    registerFields: ['full_name', 'company_name', 'phone'],
  },
  candidate: {
    label: 'Candidat',
    blurb: 'Découvrez les offres, postulez en un clic et valorisez votre parcours avec un entretien IA bienveillant.',
    canRegister: true,
    loginHome: '/candidate/dashboard',
    registerHome: '/candidate/dashboard',
    login: ({ email, password }) => loginCandidate(email, password),
    register: ({ full_name = '', email, password, phone = '' }) =>
      registerCandidate({ full_name, email, password, phone }),
    registerFields: ['full_name', 'phone'],
  },
  admin: {
    label: 'Administrateur',
    blurb: 'Pilotez la plateforme : utilisateurs, entreprises, offres, candidatures et rapports.',
    canRegister: false, // admin accounts are invite-only (token-gated backend)
    loginHome: '/admin',
    registerHome: '/admin',
    login: ({ email, password }) => adminLogin(email, password),
    registerFields: [],
  },
};

export const isRole = (v: string | undefined): v is Role =>
  v === 'recruiter' || v === 'candidate' || v === 'admin';

import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  FileEdit,
  Users,
  Search,
  Sparkles,
  Bookmark,
  FileText,
  MessageSquareText,
  BarChart3,
  Bell,
  Building2,
  Settings,
  Compass,
  Lightbulb,
  Star,
  UserCircle,
} from 'lucide-react';
import type { NavSection, Role } from './types';

/**
 * Per-role navigation. Routes follow the approved role-namespaced scheme.
 * `comingSoon: true` marks features without backend support yet (rendered as
 * polished ComingSoon screens). Admin paths match the EXISTING admin routes.
 */
export const navConfig: Record<Role, NavSection[]> = {
  admin: [
    {
      items: [
        { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
        { label: 'Utilisateurs', to: '/admin/users', icon: Users },
        { label: 'Entreprises', to: '/admin/companies', icon: Building2 },
        { label: 'Offres', to: '/admin/jobs', icon: Briefcase },
        { label: 'Candidatures', to: '/admin/applications', icon: FileText },
        { label: 'Rapports', to: '/admin/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Système',
      items: [{ label: 'Paramètres', to: '/admin/settings', icon: Settings }],
    },
  ],

  recruiter: [
    {
      items: [{ label: 'Tableau de bord', to: '/recruiter/dashboard', icon: LayoutDashboard, end: true }],
    },
    {
      title: 'Recrutement',
      items: [
        { label: 'Offres', to: '/recruiter/jobs', icon: Briefcase, end: true },
        { label: 'Créer une offre', to: '/recruiter/jobs/new', icon: PlusCircle },
        { label: 'Brouillons', to: '/recruiter/jobs/drafts', icon: FileEdit},
      ],
    },
    {
      title: 'Talents',
      items: [
        { label: 'Recherche', to: '/recruiter/candidates', icon: Search, end: true },
        { label: 'Matching IA', to: '/recruiter/candidates/matching', icon: Sparkles },
        { label: 'Vivier de talents', to: '/recruiter/candidates/pool', icon: Bookmark},
      ],
    },
    {
      title: 'Suivi',
      items: [
        { label: 'Candidatures', to: '/recruiter/applications', icon: FileText },
        { label: 'Entretiens', to: '/recruiter/interviews', icon: MessageSquareText },
        { label: 'Analytique', to: '/recruiter/analytics', icon: BarChart3},
        { label: 'Notifications', to: '/recruiter/notifications', icon: Bell},
      ],
    },
    {
      title: 'Compte',
      items: [
        { label: 'Entreprise', to: '/recruiter/company', icon: Building2 },
        { label: 'Paramètres', to: '/recruiter/settings', icon: Settings },
      ],
    },
  ],

  candidate: [
    {
      items: [
        { label: 'Tableau de bord', to: '/candidate/dashboard', icon: LayoutDashboard, end: true },
        { label: 'Statistiques', to: '/candidate/statistics', icon: BarChart3 },
      ],
    },
    {
      title: 'Carrière',
      items: [
        { label: 'Découvrir les offres', to: '/candidate/jobs', icon: Compass },
        { label: 'Offres recommandées', to: '/candidate/recommended', icon: Star},
        { label: 'Mes candidatures', to: '/candidate/applications', icon: FileText},
        { label: 'Mes entretiens', to: '/candidate/interviews', icon: MessageSquareText},
      ],
    },
    {
      title: 'Profil',
      items: [
        { label: 'Mon CV', to: '/candidate/resume', icon: FileText},
        { label: 'Insights carrière', to: '/candidate/insights', icon: Lightbulb},
        { label: 'Mon profil', to: '/candidate/profile', icon: UserCircle },
      ],
    },
    {
      title: 'Compte',
      items: [
        { label: 'Notifications', to: '/candidate/notifications', icon: Bell},
        { label: 'Paramètres', to: '/candidate/settings', icon: Settings },
      ],
    },
  ],
};

export const roleHome: Record<Role, string> = {
  admin: '/admin',
  recruiter: '/recruiter/dashboard',
  candidate: '/candidate/dashboard',
};

export const roleLabel: Record<Role, string> = {
  admin: 'Administrateur',
  recruiter: 'Recruteur',
  candidate: 'Candidat',
};

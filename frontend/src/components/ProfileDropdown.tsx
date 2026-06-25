'use client';

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { AuthUser } from '@/lib/types';
import { logout } from '@/lib/recruiterAuth';
import RecruiterProfileModal from './RecruiterProfileModal';

interface ProfileDropdownProps {
  user: AuthUser;
  onProfileSaved?: () => void;
}

export default function ProfileDropdown({ user, onProfileSaved }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'profile' | 'settings'>('profile');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/recruiter/login', { replace: true });
  };

  const openModal = (tab: 'profile' | 'settings') => {
    setIsOpen(false);
    setModalTab(tab);
    setModalOpen(true);
  };

  const initials = (user.fullName || user.email || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div ref={dropdownRef} className="relative">
        {/* Trigger button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors group"
        >
          {/* Avatar */}
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Profile"
              className="w-9 h-9 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
          )}

          {/* Name & company */}
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900 leading-tight">
              {user.fullName || user.email}
            </p>
            {user.companyName && (
              <p className="text-xs text-gray-500 leading-tight">{user.companyName}</p>
            )}
          </div>

          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.fullName || 'Recruiter'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              <button
                onClick={() => openModal('profile')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <User className="w-4 h-4 text-gray-400" />
                Profile
              </button>
              <button
                onClick={() => openModal('settings')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Company Details
              </button>
            </div>

            <div className="border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
                Log out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile / Settings modal */}
      <RecruiterProfileModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={user}
        initialTab={modalTab}
        onSaved={onProfileSaved}
      />
    </>
  );
}

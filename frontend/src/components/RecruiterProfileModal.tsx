'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Building2, Upload, Loader2, Globe, Link2, Mail, Phone, MapPin, Calendar, FileText, Briefcase, Trash2 } from 'lucide-react';
import { AuthUser } from '@/lib/types';
import { updateRecruiterProfile, uploadAvatar, RecruiterProfileData } from '@/lib/recruiterProfileService';
import toast from 'react-hot-toast';

interface RecruiterProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: AuthUser;
  initialTab?: 'profile' | 'settings';
  onSaved?: () => void;
}

const COMPANY_SIZE_OPTIONS = [
  { value: '', label: 'Select company size' },
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '500+', label: '500+ employees' },
];

export default function RecruiterProfileModal({
  open,
  onClose,
  user,
  initialTab = 'profile',
  onSaved,
}: RecruiterProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(initialTab);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state — profile tab
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Form state — settings tab
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLinkedinUrl, setCompanyLinkedinUrl] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyFoundedYear, setCompanyFoundedYear] = useState('');

  // Reset when user changes or modal opens
  useEffect(() => {
    if (open && user) {
      setActiveTab(initialTab);
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setCompanyName(user.companyName || '');
      setCompanyDescription(user.companyDescription || '');
      setCompanyIndustry(user.companyIndustry || '');
      setCompanySize(user.companySize || '');
      setCompanyWebsite(user.companyWebsite || '');
      setCompanyLinkedinUrl(user.companyLinkedinUrl || '');
      setCompanyEmail(user.companyEmail || '');
      setCompanyPhone(user.companyPhone || '');
      setCompanyAddress(user.companyAddress || '');
      setCompanyFoundedYear(user.companyFoundedYear?.toString() || '');
      setAvatarPreview(user.avatarUrl || null);
      setAvatarFile(null);
    }
  }, [open, user, initialTab]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload avatar first if a new file was selected, or handle removal
      let newAvatarUrl = user.avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(user.id, avatarFile);
      } else if (avatarPreview === null) {
        newAvatarUrl = ''; // Mark for removal
      }

      const updates: RecruiterProfileData & { avatar_url?: string } = {
        full_name: fullName || undefined,
        phone: phone || undefined,
        company_name: companyName || undefined,
        company_description: companyDescription || undefined,
        company_industry: companyIndustry || undefined,
        company_size: companySize || undefined,
        company_website: companyWebsite || undefined,
        company_linkedin_url: companyLinkedinUrl || undefined,
        company_email: companyEmail || undefined,
        company_phone: companyPhone || undefined,
        company_address: companyAddress || undefined,
        company_founded_year: companyFoundedYear ? parseInt(companyFoundedYear, 10) : undefined,
        avatar_url: newAvatarUrl,
      };

      await updateRecruiterProfile(user.id, updates);
      toast.success('Profile updated successfully');
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = (fullName || user.fullName || user.email || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'settings' as const, label: 'Company Details', icon: Building2 },
  ];

  const inputClasses =
    'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none shadow-sm transition-all';
  const labelClasses = 'block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] mx-4 bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-150 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Account Settings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage your personal profile and company attributes.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Indicator */}
        <div className="px-6 pt-5 shrink-0">
          <div className="flex p-1 bg-gray-100/80 rounded-xl max-w-xs shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 focus:outline-none ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Logo / Avatar Upload Dropzone */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-gray-50/50 rounded-2xl border border-gray-150 shadow-inner">
                <div className="relative group shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Company logo"
                      className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm border border-indigo-200/50">
                      <span className="text-xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 cursor-pointer"
                    title="Upload new image"
                  >
                    <Upload className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">Company Logo</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-normal max-w-sm">
                    Recommended: Square dimensions. JPG, PNG or SVG format under 5 MB.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      Choose file
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-destructive bg-white hover:bg-destructive/5 border border-gray-200 hover:border-destructive/20 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Details Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-gray-100 pb-2">Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className={`${inputClasses} pl-10 bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200/60 shadow-none`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555 000 0000"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Company Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your company name"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* About Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-gray-100 pb-2">About the Company</h4>
                <div>
                  <label className={labelClasses}>Company Description</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      rows={3}
                      value={companyDescription}
                      onChange={(e) => setCompanyDescription(e.target.value)}
                      placeholder="Tell candidates about your company's mission, values, and work culture..."
                      className={`${inputClasses} pl-10 resize-none`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className={labelClasses}>Industry</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        placeholder="e.g. Technology"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <label className={labelClasses}>Company Size</label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className={inputClasses}
                    >
                      {COMPANY_SIZE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className={labelClasses}>Founded Year</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="number"
                        min={1800}
                        max={new Date().getFullYear()}
                        value={companyFoundedYear}
                        onChange={(e) => setCompanyFoundedYear(e.target.value)}
                        placeholder="e.g. 2020"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Web presence Section */}
              <div className="space-y-4 border-t border-gray-100 pt-5">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-gray-100 pb-2">Web & Social Presence</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>LinkedIn Page</label>
                    <div className="relative">
                      <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={companyLinkedinUrl}
                        onChange={(e) => setCompanyLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/company/..."
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact info Section */}
              <div className="space-y-4 border-t border-gray-100 pt-5">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest border-b border-gray-100 pb-2">Company Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Inquiries Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="hr@company.com"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClasses}>Inquiries Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        placeholder="+1 555 000 0000"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Office Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      rows={2}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Street name, Suite, City, State, Country"
                      className={`${inputClasses} pl-10 resize-none`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-150 bg-gray-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center gap-2 cursor-pointer"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

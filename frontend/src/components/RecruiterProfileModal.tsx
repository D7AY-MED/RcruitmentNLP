'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Building2, Upload, Loader2, Globe, Link2, Mail, Phone, MapPin, Calendar, FileText, Briefcase } from 'lucide-react';
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload avatar first if a new file was selected
      let newAvatarUrl = user.avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(user.id, avatarFile);
      }

      const updates: RecruiterProfileData = {
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
    'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar section */}
              <div className="flex items-center gap-5">
                <div className="relative group">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Company logo"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border-2 border-indigo-200">
                      <span className="text-xl font-bold text-white">{initials}</span>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors cursor-pointer"
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
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Company Logo</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    JPG, PNG or SVG. Max 5 MB.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Upload new image
                  </button>
                </div>
              </div>

              {/* Personal fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className={`${inputClasses} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className={`${inputClasses} pl-9 bg-gray-50 text-gray-500 cursor-not-allowed`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className={`${inputClasses} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Your company"
                      className={`${inputClasses} pl-9`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Company description */}
              <div>
                <label className={labelClasses}>
                  <FileText className="inline w-4 h-4 mr-1.5 text-gray-400 -mt-0.5" />
                  Company Description
                </label>
                <textarea
                  rows={3}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Tell candidates about your company..."
                  className={`${inputClasses} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>
                    <Briefcase className="inline w-4 h-4 mr-1.5 text-gray-400 -mt-0.5" />
                    Industry
                  </label>
                  <input
                    type="text"
                    value={companyIndustry}
                    onChange={(e) => setCompanyIndustry(e.target.value)}
                    placeholder="e.g. Technology, Finance..."
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <User className="inline w-4 h-4 mr-1.5 text-gray-400 -mt-0.5" />
                    Company Size
                  </label>
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
                <div>
                  <label className={labelClasses}>
                    <Globe className="inline w-4 h-4 mr-1.5 text-gray-400 -mt-0.5" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <Link2 className="inline w-4 h-4 mr-1.5 text-gray-400 -mt-0.5" />
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={companyLinkedinUrl}
                    onChange={(e) => setCompanyLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <Mail className="inline w-4 h-4 mr-1.5 text-gray-400 -mt-0.5" />
                    Company Email
                  </label>
                  <input
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    <Phone className="inline w-4 h-4 mr-1.5 text-gray-400 -mt-0.5" />
                    Company Phone
                  </label>
                  <input
                    type="tel"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className={inputClasses}
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>
                  <MapPin className="inline w-4 h-4 mr-1.5 text-gray-400 -mt-0.5" />
                  Company Address
                </label>
                <textarea
                  rows={2}
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className={`${inputClasses} resize-none`}
                />
              </div>

              <div className="w-1/2">
                <label className={labelClasses}>
                  <Calendar className="inline w-4 h-4 mr-1.5 text-gray-400 -mt-0.5" />
                  Founded Year
                </label>
                <input
                  type="number"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={companyFoundedYear}
                  onChange={(e) => setCompanyFoundedYear(e.target.value)}
                  placeholder="e.g. 2020"
                  className={inputClasses}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

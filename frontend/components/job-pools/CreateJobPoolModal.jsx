'use client';
import React, { useState, useEffect, KeyboardEvent } from 'react';
import { 
  X, Loader2, CheckCircle2, ExternalLink, ChevronRight, ChevronLeft, 
  Plus, Trash2, ArrowUp, ArrowDown, GripVertical, Check, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CopyLinkButton from '@/components/job-pools/CopyLinkButton';
import { createJobPool, publicPoolUrl } from '@/lib/frontendData';

const SENIORITY_LEVELS = ['Intern', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director'];
const INTERVIEW_FOCUS_AREAS = [
  { id: 'Technical Skills', label: 'Technical Skills', group: 'Hard Skills' },
  { id: 'Problem Solving', label: 'Problem Solving', group: 'Soft Skills' },
  { id: 'Communication', label: 'Communication', group: 'Soft Skills' },
  { id: 'Leadership', label: 'Leadership', group: 'Soft Skills' },
  { id: 'Teamwork', label: 'Teamwork', group: 'Soft Skills' },
  { id: 'Culture Fit', label: 'Culture Fit', group: 'Culture' },
  { id: 'Motivation', label: 'Motivation', group: 'Culture' },
  { id: 'Learning Ability', label: 'Learning Ability', group: 'Soft Skills' },
  { id: 'Project Experience', label: 'Project Experience', group: 'Hard Skills' },
  { id: 'Other', label: 'Other', group: 'Other' },
];

const PREDEFINED_DEAL_BREAKERS = [
  'Outside Required Timezone',
  'Lacks Specific Certification',
  'Unwilling to Relocate',
  'Cannot Travel as Required'
];

const PREDEFINED_COMPETENCIES = [
  'Analytical Thinking', 'Adaptability', 'Strategic Planning', 'Conflict Resolution',
  'Creativity', 'Attention to Detail', 'Time Management', 'Empathy', 'Decision Making'
];

const PREDEFINED_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Arabic', 'Other'
];

// Tooltip helper
const InfoTooltip = ({ text }) => (
  <div className="group relative inline-flex items-center ml-1.5 align-middle cursor-help">
    <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden w-60 bg-white text-slate-800 text-xs font-medium leading-relaxed border border-slate-200 rounded-lg py-2.5 px-3 group-hover:block z-50 text-center shadow-xl pointer-events-none">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-x-[6px] border-x-transparent border-t-[6px] border-t-slate-200">
        <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-white"></div>
      </div>
    </div>
  </div>
);

// Reusable Tags Input
const TagsInput = ({ placeholder, tags, setTags }) => {
  const [input, setInput] = useState('');
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) {
        setTags([...tags, input.trim()]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border border-input rounded-lg bg-background focus-within:ring-2 focus-within:ring-ring transition-all min-h-[42px]">
      {tags.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
          {tag}
          <button type="button" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
};

/**
 * Enhanced Multi-step Create Job Pool Modal
 */
export default function CreateJobPoolModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    seniority: '',
    mission: '',
    experience: '',
    responsibilities: [''],
    mustHaveSkills: [],
    niceToHaveSkills: [],
    languages: [],
    competencies: [],
    dealBreakers: [],
    dealBreakersCustom: '',
    interviewFocus: [],
    notes: '',
    languagesCustom: ''
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setError('');
      setCreated(null);
      setSubmitting(false);
      setFormData({
        title: '',
        seniority: '',
        mission: '',
        experience: '',
        responsibilities: [''],
        mustHaveSkills: [],
        niceToHaveSkills: [],
        languages: [],
        competencies: [],
        dealBreakers: [],
        dealBreakersCustom: '',
        interviewFocus: [],
        notes: '',
        languagesCustom: ''
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.title.trim()) {
        setError('Job title is required to continue.');
        return;
      }
      if (!formData.mission.trim()) {
        setError('Main Mission of the role is required to continue.');
        return;
      }
    }
    if (step === 2) {
      if (formData.mustHaveSkills.length === 0) {
        setError('At least one Must-Have Skill is required to continue.');
        return;
      }
    }
    setError('');
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(s => s - 1);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Job title is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        title: formData.title,
        seniority_level: formData.seniority || null,
        years_experience: formData.experience ? parseInt(formData.experience, 10) : null,
        main_mission: formData.mission,
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        must_have_skills: formData.mustHaveSkills,
        nice_to_have_skills: formData.niceToHaveSkills,
        soft_skills: formData.competencies,
        deal_breakers: [
          ...formData.dealBreakers,
          ...(formData.dealBreakersCustom.trim() ? [formData.dealBreakersCustom.trim()] : [])
        ],
        languages: formData.languages,
        notes: formData.notes
      };
      
      const pool = await createJobPool(payload);
      setCreated(pool);
      onCreated?.(pool);
    } catch (err) {
      setError(err.message || 'Failed to create pool.');
    } finally {
      setSubmitting(false);
    }
  };

  // UI Helpers
  const StepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {[1, 2, 3].map((num) => (
        <React.Fragment key={num}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
            step === num ? 'bg-primary text-primary-foreground shadow-md' :
            step > num ? 'bg-primary/20 text-primary cursor-pointer' : 'bg-muted text-muted-foreground'
          }`}
          onClick={() => step > num && setStep(num)}
          >
            {step > num ? <Check className="w-4 h-4" /> : num}
          </div>
          {num < 3 && (
            <div className={`h-1 w-12 rounded transition-colors duration-300 ${step > num ? 'bg-primary/30' : 'bg-muted'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );



  const renderStep1 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">Role Basics</h3>
        <p className="text-sm text-muted-foreground">Let's start with the high-level details of the position.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Job title <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="e.g. Senior Product Designer"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Seniority Level</label>
          <select
            value={formData.seniority}
            onChange={(e) => updateField('seniority', e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
          >
            <option value="">Select level...</option>
            {SENIORITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Years of Experience</label>
          <input
            type="number"
            min="0"
            max="50"
            value={formData.experience}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                updateField('experience', '');
              } else {
                const num = Number(val);
                if (num > 50) {
                  updateField('experience', '50');
                } else if (num < 0) {
                  updateField('experience', '0');
                } else {
                  updateField('experience', val);
                }
              }
            }}
            placeholder="e.g. 5"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Main Mission of the Role <span className="text-destructive">*</span>
          <InfoTooltip text="The overarching purpose or ultimate goal this candidate needs to achieve." />
        </label>
        <textarea
          rows={3}
          value={formData.mission}
          onChange={(e) => updateField('mission', e.target.value)}
          placeholder="What is the primary goal this person needs to achieve?"
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">Skills & Responsibilities</h3>
        <p className="text-sm text-muted-foreground">What will they do and what do they need to know?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2 flex items-center justify-between">
          <span className="flex items-center">Top 3 Responsibilities <InfoTooltip text="The three most critical day-to-day tasks or expected outcomes." /></span>
          <span className="text-xs text-muted-foreground font-normal">{formData.responsibilities.length}/3 max</span>
        </label>
        <div className="space-y-2">
          {formData.responsibilities.map((resp, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-medium">
                {i + 1}
              </span>
              <input
                type="text"
                value={resp}
                onChange={(e) => {
                  const newResps = [...formData.responsibilities];
                  newResps[i] = e.target.value;
                  updateField('responsibilities', newResps);
                }}
                placeholder="e.g. Lead the architecture of..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {formData.responsibilities.length > 1 && (
                <button
                  type="button"
                  onClick={() => updateField('responsibilities', formData.responsibilities.filter((_, idx) => idx !== i))}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {formData.responsibilities.length < 3 && (
            <button
              type="button"
              onClick={() => updateField('responsibilities', [...formData.responsibilities, ''])}
              className="mt-2 text-sm text-primary hover:text-primary/80 font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Responsibility
            </button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Must-Have Skills <span className="text-destructive">*</span>
            <InfoTooltip text="Absolute non-negotiable hard skills required for consideration." />
          </label>
          <TagsInput 
            placeholder="Type skill & press Enter..." 
            tags={formData.mustHaveSkills} 
            setTags={(t) => updateField('mustHaveSkills', t)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Nice-to-Have Skills
            <InfoTooltip text="Bonus skills that make a candidate stand out, but aren't strictly required." />
          </label>
          <TagsInput 
            placeholder="Type skill & press Enter..." 
            tags={formData.niceToHaveSkills} 
            setTags={(t) => updateField('niceToHaveSkills', t)} 
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Language Requirements</label>
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val && !formData.languages.includes(val)) {
              updateField('languages', [...formData.languages, val]);
            }
            e.target.value = '';
          }}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow mb-2"
        >
          <option value="">+ Add a language...</option>
          {PREDEFINED_LANGUAGES.map(lang => (
            <option key={lang} value={lang} disabled={formData.languages.includes(lang)}>{lang}</option>
          ))}
        </select>
        
        <div className="flex flex-wrap gap-2">
          {formData.languages.map((lang, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm font-medium border border-border">
              {lang}
              <button type="button" onClick={() => updateField('languages', formData.languages.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-foreground ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        {formData.languages.includes('Other') && (
          <input
            type="text"
            value={formData.languagesCustom}
            onChange={(e) => updateField('languagesCustom', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && formData.languagesCustom.trim()) {
                e.preventDefault();
                const newLang = formData.languagesCustom.trim();
                if (!formData.languages.includes(newLang)) {
                  updateField('languages', [...formData.languages.filter(l => l !== 'Other'), newLang]);
                } else {
                  updateField('languages', formData.languages.filter(l => l !== 'Other'));
                }
                updateField('languagesCustom', '');
              }
            }}
            placeholder="Type language and press Enter to add..."
            className="w-full mt-3 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
            autoFocus
          />
        )}
      </div>
    </div>
  );

  const renderStep3 = () => {
    // Handling competencies list
    const addCompetency = (e) => {
      const val = e.target.value;
      if (val && !formData.competencies.includes(val) && formData.competencies.length < 5) {
        updateField('competencies', [...formData.competencies, val]);
      }
      e.target.value = ''; // Reset select
    };

    const moveCompetency = (index, dir) => {
      const arr = [...formData.competencies];
      if (dir === 'up' && index > 0) {
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      } else if (dir === 'down' && index < arr.length - 1) {
        [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
      }
      updateField('competencies', arr);
    };

    const toggleInterviewFocus = (id) => {
      const prev = formData.interviewFocus;
      if (prev.includes(id)) {
        updateField('interviewFocus', prev.filter(x => x !== id));
      } else {
        updateField('interviewFocus', [...prev, id]);
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-foreground">Assessment Focus</h3>
          <p className="text-sm text-muted-foreground">What exactly are we evaluating candidates on?</p>
        </div>

        <div className="bg-muted p-4 rounded-xl border border-border">
          <label className="block text-sm font-medium text-foreground mb-2 flex justify-between items-center">
            <span className="flex items-center">Soft Skills (Ranked) <InfoTooltip text="Rank the top 5 behavioral or interpersonal traits essential for cultural and role fit." /></span>
            <span className="text-xs text-muted-foreground">{formData.competencies.length}/5 selected</span>
          </label>
          <select 
            onChange={addCompetency} 
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={formData.competencies.length >= 5}
          >
            <option value="">+ Add a competency...</option>
            {PREDEFINED_COMPETENCIES.map(c => (
              <option key={c} value={c} disabled={formData.competencies.includes(c)}>{c}</option>
            ))}
          </select>
          <div className="space-y-2">
            {formData.competencies.map((comp, i) => (
              <div key={comp} className="flex items-center gap-2 bg-background border border-border p-2 rounded-lg group shadow-sm transition-all hover:border-primary/50">
                <span className="flex-shrink-0 w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium">{comp}</span>
                <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => moveCompetency(i, 'up')} disabled={i === 0} className="p-1 hover:bg-muted rounded disabled:opacity-30">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => moveCompetency(i, 'down')} disabled={i === formData.competencies.length - 1} className="p-1 hover:bg-muted rounded disabled:opacity-30">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => updateField('competencies', formData.competencies.filter(c => c !== comp))} className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {formData.competencies.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">Select competencies from the dropdown above to rank them.</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3 flex items-center">
            Deal-Breakers <InfoTooltip text="Factors that will immediately disqualify a candidate." />
          </label>
          <div className="space-y-2 mb-3">
            {PREDEFINED_DEAL_BREAKERS.map(db => (
              <label key={db} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.dealBreakers.includes(db)}
                  onChange={(e) => {
                    if(e.target.checked) updateField('dealBreakers', [...formData.dealBreakers, db]);
                    else updateField('dealBreakers', formData.dealBreakers.filter(x => x !== db));
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-destructive focus:ring-destructive"
                />
                <span className="text-sm text-foreground">{db}</span>
              </label>
            ))}
          </div>
          <textarea
            rows={2}
            value={formData.dealBreakersCustom}
            onChange={(e) => updateField('dealBreakersCustom', e.target.value)}
            placeholder="Other custom deal-breakers..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Additional Notes</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Any other details, internal notes, or specific instructions for evaluating candidates..."
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-shadow"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 bg-black/60 overflow-y-auto transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label="Create job pool"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-3xl bg-white border border-border rounded-2xl shadow-2xl my-8 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted">
          <h2 className="text-xl font-bold text-foreground">
            {created ? 'Pool created successfully 🎉' : 'Create New Job Pool'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shadow-sm"
            aria-label="Close"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        {created ? (
          <div className="p-8 animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">{created.title}</h3>
            <p className="text-muted-foreground mb-8 max-w-md">
              Your pool has been configured successfully. The public application link is ready to be shared with candidates.
            </p>
            
            <div className="w-full max-w-md rounded-xl border border-border bg-muted/30 p-5 mb-8 text-left shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Public Application Link</p>
              <CopyLinkButton value={publicPoolUrl(created.public_slug)} className="w-full" />
            </div>
            
            <Button onClick={onClose} size="lg" className="w-full max-w-md font-semibold">Go to Dashboard</Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
              <StepIndicator />

              {error && (
                <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2 animate-in slide-in-from-top-2">
                  <X className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted flex items-center justify-between">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep} disabled={submitting} className="font-medium">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={onClose} disabled={submitting} className="text-muted-foreground">
                  Cancel
                </Button>
              )}

              {step < 3 ? (
                <Button type="button" onClick={nextStep} className="font-medium bg-primary text-primary-foreground shadow-sm">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button type="button" onClick={submit} disabled={submitting} className="font-medium shadow-md">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Creating Pool…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Finish & Create
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

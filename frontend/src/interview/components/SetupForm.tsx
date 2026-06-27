'use client';

import { FormEvent, useState } from 'react';
import { Upload, CheckCircle2, X, Phone, ArrowRight, Lock, Loader2 } from 'lucide-react';

interface SetupFormProps {
  onStart: (formData: FormData) => Promise<void>;
  isStarting: boolean;
}

export default function SetupForm({ onStart, isStarting }: SetupFormProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [phone, setPhone] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cvFile) {
      setError('Veuillez télécharger un fichier CV.');
      return;
    }

    const formData = new FormData();
    formData.set('cvFile', cvFile);
    if (phone.trim()) {
      formData.set('phone', phone.trim());
    }

    try {
      await onStart(formData);
    } catch (err: any) {
      setError(err.message || 'Impossible de démarrer l\'entretien.');
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCvFile(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Professional Resume */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 px-1 block">
          Professional Resume
        </label>
        
        <div
          className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all duration-300 ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-gray-200 bg-gray-50/50 hover:border-blue-500'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0] ?? null;
            if (file) setCvFile(file);
            setIsDragOver(false);
          }}
        >
          <input
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f) setCvFile(f); }}
          />

          {!cvFile ? (
            <div className="text-center space-y-2 pointer-events-none">
              <Upload className="w-12 h-12 text-blue-600 mx-auto" />
              <div className="text-base text-gray-900">
                Drop your CV here or <span className="text-blue-600 font-semibold">Browse</span>
              </div>
              <div className="text-xs text-gray-500">
                Supports PDF or TXT (Max 5MB)
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-blue-50 text-blue-800 p-4 rounded-xl w-full justify-center border border-blue-100 z-10">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="text-sm font-medium truncate max-w-[240px]">
                {cvFile.name}
              </span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-2 hover:bg-blue-100 p-1 rounded-full transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4 text-blue-700" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Phone Number Input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 px-1 block" htmlFor="phone">
          Phone Number
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400 pointer-events-none">
            <Phone className="w-5 h-5" />
          </div>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* CTA */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isStarting}
          className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-sm hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              Start Interview
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Privacy Trust Note */}
      <div className="flex items-center justify-center gap-2 text-gray-400 pt-2">
        <Lock className="w-4 h-4 text-gray-400 fill-current animate-none" />
        <span className="text-xs font-medium">
          Encrypted and private screening powered by PooLink AI
        </span>
      </div>
    </form>
  );
}

'use client';

import { FormEvent, useRef, useState } from 'react';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface SetupFormProps {
  onStart: (formData: FormData) => Promise<void>;
  isStarting: boolean;
}

export default function SetupForm({ onStart, isStarting }: SetupFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvText, setCvText] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cvText.trim() && !cvFile) {
      setError('Veuillez coller votre CV ou télécharger un fichier CV.');
      return;
    }

    const formData = new FormData();
    if (cvText.trim()) formData.set('cvText', cvText.trim());
    if (cvFile) formData.set('cvFile', cvFile);

    try {
      await onStart(formData);
    } catch (err: any) {
      setError(err.message || 'Impossible de démarrer l\'entretien.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Votre CV (texte)
        </label>
        <textarea
          value={cvText}
          onChange={(e) => { setCvText(e.target.value); setError(null); }}
          placeholder="Collez le contenu de votre CV ici..."
          rows={6}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 focus:bg-white focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
        />
      </div>

      <div className="text-center text-sm text-gray-400 font-medium">— ou —</div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Télécharger un fichier CV
        </label>
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : cvFile
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
          }`}
          onClick={openFilePicker}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0] ?? null;
            if (file) setCvFile(file);
            setIsDragOver(false);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilePicker(); } }}
        >
          {cvFile ? (
            <div className="flex items-center justify-center gap-2 text-green-700">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">{cvFile.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Upload className="w-6 h-6" />
              <p className="text-sm font-medium">Cliquez ou déposez votre CV ici</p>
              <p className="text-xs">PDF ou TXT (max 5 Mo)</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setCvFile(f); }}
        />
      </div>

      <button
        type="submit"
        disabled={isStarting}
        className="w-full h-12 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: 'linear-gradient(to right, #2563EB 70%, #60A5FA 130%)' }}
      >
        {isStarting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Préparation de l&apos;entretien...
          </>
        ) : (
          'Commencer l\'entretien'
        )}
      </button>
    </form>
  );
}

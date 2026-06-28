'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ElementType } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  ExternalLink,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  X,
  AlertTriangle,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Lightbulb,
  Gauge,
  FileUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCv, uploadCv, deleteCv, type CvInfo } from '@/lib/candidateAuth';
import { profileCompletion } from '@/lib/candidateData';
import { PageHeader, GlassCard, Button, Badge } from '@/shared/components';
import type { CandidateOutlet } from '../CandidateShell';

const MAX_MB = 10;
const LOAD_TIMEOUT_MS = 8000;
let cvCache: CvInfo | null = null;

function fmtSize(bytes?: number) {
  if (!bytes) return '—';
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} Ko` : `${(kb / 1024).toFixed(1)} Mo`;
}

export default function CandidateResumePage() {
  const { candidate } = useOutletContext<CandidateOutlet>();
  const inputRef = useRef<HTMLInputElement>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const [cv, setCv] = useState<CvInfo | null>(cvCache);
  const [pageStatus, setPageStatus] = useState<'loading' | 'ready' | 'error'>(cvCache ? 'ready' : 'loading');
  const [replacing, setReplacing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
    }, LOAD_TIMEOUT_MS);

    if (!cvCache) setPageStatus('loading');
    getCv(ctrl.signal)
      .then((info) => {
        cvCache = info;
        setCv(info);
        setPageStatus('ready');
      })
      .catch(() => {
        if (ctrl.signal.aborted && !timedOut) return;
        if (cvCache) setPageStatus('ready');
        else setPageStatus('error');
      })
      .finally(() => clearTimeout(timer));
  }, []);

  useEffect(() => {
    load();
    return () => ctrlRef.current?.abort();
  }, [load]);

  const hasCv = !!cv?.cv_url;
  const isPdf = /\.pdf(\?|$)/i.test(cv?.cv_url || '');
  const format = isPdf ? 'PDF' : (cv?.name?.split('.').pop() || '').toUpperCase() || '—';
  const dateLabel = cv?.updated_at ? new Date(cv.updated_at).toLocaleDateString('fr-FR') : "Aujourd'hui";
  const showUploader = !hasCv || replacing;

  const readiness = useMemo(() => {
    const p = profileCompletion(candidate).pct;
    return Math.round((hasCv ? 50 : 0) + p / 2);
  }, [candidate, hasCv]);

  const onPickFile = () => inputRef.current?.click();

  const handleFile = useCallback(async (file?: File | null) => {
    if (!file) return;
    if (!/\.(pdf|docx?)$/i.test(file.name)) {
      setMsg({ type: 'error', text: 'Formats acceptés : PDF, DOC ou DOCX.' });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setMsg({ type: 'error', text: `Le fichier dépasse la taille maximale (${MAX_MB} Mo).` });
      return;
    }
    setUploading(true);
    setProgress(0);
    setMsg(null);
    try {
      const info = await uploadCv(file, setProgress);
      cvCache = info;
      setCv(info);
      setReplacing(false);
      setMsg({ type: 'success', text: 'CV enregistré avec succès.' });
    } catch (e) {
      setMsg({ type: 'error', text: (e as Error)?.message || 'Échec du téléversement.' });
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, []);

  const handleRemove = useCallback(async () => {
    setRemoving(true);
    setMsg(null);
    try {
      await deleteCv();
      cvCache = { cv_url: null };
      setCv({ cv_url: null });
      setReplacing(false);
      setMsg({ type: 'success', text: 'CV supprimé.' });
    } catch (e) {
      setMsg({ type: 'error', text: (e as Error)?.message || 'Échec de la suppression.' });
    } finally {
      setRemoving(false);
    }
  }, []);

  return (
    <div className="max-w-[1400px]">
      <PageHeader
        title="Mon CV"
        subtitle="Importez, gérez et gardez votre CV à jour."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Lightbulb className="w-4 h-4" />} onClick={() => setShowTips((v) => !v)}>
              <span className="hidden sm:inline">Conseils CV</span>
            </Button>
            {hasCv && !replacing && (
              <Button size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => setReplacing(true)}>
                <span className="hidden sm:inline">Remplacer</span>
              </Button>
            )}
          </div>
        }
      />

      {showTips && (
        <GlassCard className="mb-5 p-4 flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-cyan-soft text-cyan flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </span>
          <div className="text-sm text-ink">
            <p className="font-semibold">Conseils pour un CV qui se démarque</p>
            <p className="mt-1 text-muted">
              Un CV d'une page, structuré, avec des résultats chiffrés et des mots-clés du poste. Privilégiez le PDF pour préserver la mise en page.
            </p>
          </div>
          <button onClick={() => setShowTips(false)} aria-label="Fermer" className="ml-auto p-1 rounded-md text-muted hover:text-ink hover:bg-surface-2">
            <X className="w-4 h-4" />
          </button>
        </GlassCard>
      )}

      {pageStatus === 'loading' && (
        <GlassCard className="p-12 flex flex-col items-center justify-center gap-3 min-h-[60vh]">
          <Loader2 className="w-7 h-7 animate-spin text-brand" />
          <p className="text-sm text-muted">Chargement de votre CV…</p>
        </GlassCard>
      )}

      {pageStatus === 'error' && (
        <GlassCard className="p-12 flex flex-col items-center justify-center text-center gap-3 min-h-[60vh]">
          <span className="w-12 h-12 rounded-2xl bg-danger-soft text-danger flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </span>
          <h3 className="font-display text-base font-bold text-ink">Impossible de charger votre CV</h3>
          <p className="text-sm text-muted max-w-sm">Vérifiez votre connexion, puis réessayez.</p>
          <Button className="mt-2" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={load}>
            Réessayer
          </Button>
        </GlassCard>
      )}

      {pageStatus === 'ready' && (
        <>
          {msg && (
            <div
              className={cn(
                'mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium animate-fade-up',
                msg.type === 'success'
                  ? 'border-success/30 bg-success-soft text-success'
                  : 'border-danger/30 bg-danger-soft text-danger',
              )}
            >
              {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
              {msg.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ───────── LEFT — management panel (≈35%) ───────── */}
            <div className="lg:col-span-4 space-y-5">
              {showUploader ? (
                <UploadZone
                  uploading={uploading}
                  progress={progress}
                  drag={drag}
                  replacing={replacing}
                  hasCv={hasCv}
                  onPick={onPickFile}
                  onDragState={setDrag}
                  onFile={handleFile}
                  onCancel={() => setReplacing(false)}
                />
              ) : (
                <GlassCard className="p-6 animate-fade-up">
                  <div className="flex items-start gap-4">
                    <span className="w-14 h-14 rounded-2xl bg-brand bg-grad-brand text-brand-contrast flex items-center justify-center shrink-0 shadow-glow">
                      <FileText className="w-7 h-7" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <Badge tone="success">
                          <CheckCircle2 className="w-3 h-3" /> À jour
                        </Badge>
                        <Badge tone="neutral">v1</Badge>
                      </div>
                      <p className="text-sm font-semibold text-ink break-all">{cv?.name || 'CV'}</p>
                    </div>
                  </div>

                  <dl className="mt-6 space-y-2.5">
                    <Meta label="Format" value={format} />
                    <Meta label="Taille" value={fmtSize(cv?.size)} />
                    <Meta label="Ajouté le" value={dateLabel} />
                    <Meta label="Dernière mise à jour" value={dateLabel} />
                    <Meta label="Stockage" value="Sécurisé · privé" />
                  </dl>

                  <div className="mt-6 space-y-2">
                    <a href={cv!.cv_url!} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full" leftIcon={<Maximize2 className="w-4 h-4" />}>
                        Voir en plein écran
                      </Button>
                    </a>
                    <div className="grid grid-cols-2 gap-2">
                      <a href={cv!.cv_url!} download className="block">
                        <Button variant="outline" className="w-full" leftIcon={<Download className="w-4 h-4" />}>
                          Télécharger
                        </Button>
                      </a>
                      <Button variant="outline" className="w-full" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={() => setReplacing(true)}>
                        Remplacer
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full text-danger hover:bg-danger-soft"
                      loading={removing}
                      leftIcon={<Trash2 className="w-4 h-4" />}
                      onClick={handleRemove}
                    >
                      Supprimer le CV
                    </Button>
                  </div>
                </GlassCard>
              )}

            </div>

            {/* ───────── RIGHT — large viewer (≈65%) ───────── */}
            <div className="lg:col-span-8">
              {hasCv ? (
                <PdfViewer url={cv!.cv_url!} name={cv?.name || 'CV'} isPdf={isPdf} />
              ) : (
                <GlassCard className="flex flex-col items-center justify-center text-center p-10 min-h-[64vh]">
                  <span className="w-24 h-24 rounded-3xl bg-grad-brand-soft border border-border-brand flex items-center justify-center text-brand mb-6">
                    <UploadCloud className="w-12 h-12" />
                  </span>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Aucun CV pour le moment</h2>
                  <p className="mt-2 text-sm text-muted max-w-md">
                    Importez votre CV pour postuler en un clic et le retrouver ici à tout moment. Il sera aussi analysé par l'IA lors de vos entretiens.
                  </p>
                  <Button className="mt-6" size="lg" leftIcon={<UploadCloud className="w-4 h-4" />} onClick={onPickFile}>
                    Importer mon CV
                  </Button>
                  <p className="mt-4 text-xs text-muted">PDF, DOC ou DOCX · {MAX_MB} Mo max</p>
                </GlassCard>
              )}
            </div>
          </div>

          {/* Info tiles — full-width responsive grid (4 / 2 / 1) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
            <InfoTile
              icon={ShieldCheck}
              tone="bg-success-soft text-success"
              badge="Privé"
              badgeTone="success"
              title="Sécurité"
              desc="Vos documents sont chiffrés et stockés en toute sécurité."
            />
            <InfoTile
              icon={FileUp}
              tone="bg-brand-light text-brand"
              badge={`${MAX_MB} Mo`}
              badgeTone="blue"
              title="Formats supportés"
              desc={`PDF, DOC, DOCX — ${MAX_MB} Mo maximum.`}
            />
            <InfoTile
              icon={Lightbulb}
              tone="bg-cyan-soft text-cyan"
              badge="Astuce"
              badgeTone="cyan"
              title="Conseils recruteur"
              desc="Gardez votre CV à jour pour maximiser votre visibilité."
            />
            <InfoTile
              icon={Gauge}
              tone="bg-brand-accent-50 text-brand-accent"
              badge={readiness >= 70 ? 'AI Ready' : `${readiness}%`}
              badgeTone={readiness >= 70 ? 'success' : 'neutral'}
              title="Qualité du CV"
              desc="Basée sur votre CV et la complétion de votre profil."
              progress={readiness}
            />
          </div>

          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Sub-components ───────────────────────── */

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-brand pb-2.5 last:border-0 last:pb-0">
      <dt className="text-xs text-muted shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-ink truncate text-right">{value}</dd>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  tone,
  badge,
  badgeTone,
  title,
  desc,
  progress,
}: {
  icon: ElementType;
  tone: string;
  badge: string;
  badgeTone: 'success' | 'blue' | 'cyan' | 'neutral';
  title: string;
  desc: string;
  progress?: number;
}) {
  return (
    <div className="group h-full flex flex-col rounded-2xl border border-border-brand bg-gradient-to-br from-card to-surface p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center', tone)}>
          <Icon className="w-5 h-5" />
        </span>
        <Badge tone={badgeTone}>{badge}</Badge>
      </div>
      <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-muted leading-relaxed flex-1">{desc}</p>
      {typeof progress === 'number' && (
        <div className="mt-3 h-1.5 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-grad-brand transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function UploadZone({
  uploading,
  progress,
  drag,
  replacing,
  hasCv,
  onPick,
  onDragState,
  onFile,
  onCancel,
}: {
  uploading: boolean;
  progress: number;
  drag: boolean;
  replacing: boolean;
  hasCv: boolean;
  onPick: () => void;
  onDragState: (v: boolean) => void;
  onFile: (f?: File | null) => void;
  onCancel: () => void;
}) {
  return (
    <div className="animate-fade-up">
      <div
        role="button"
        tabIndex={0}
        aria-label="Importer un CV"
        onClick={() => !uploading && onPick()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !uploading && onPick()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) onDragState(true);
        }}
        onDragLeave={() => onDragState(false)}
        onDrop={(e) => {
          e.preventDefault();
          onDragState(false);
          if (!uploading) onFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          'group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all cursor-pointer min-h-[260px]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          uploading && 'pointer-events-none',
          drag ? 'border-brand bg-brand-light/50 scale-[1.01] shadow-glow' : 'border-border-brand bg-card hover:border-brand/50 hover:bg-surface',
        )}
      >
        <span className="w-16 h-16 rounded-2xl bg-grad-brand-soft border border-border-brand flex items-center justify-center text-brand mb-4 transition-transform group-hover:scale-105 group-hover:-translate-y-0.5">
          {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <UploadCloud className="w-8 h-8" />}
        </span>
        <h3 className="font-display text-base font-bold text-ink">
          {uploading ? `Téléversement… ${progress}%` : hasCv ? 'Remplacer votre CV' : 'Déposez votre CV ici'}
        </h3>
        <p className="mt-1 text-sm text-muted">Glissez-déposez, ou cliquez pour parcourir</p>

        {uploading ? (
          <div className="mt-5 w-full max-w-xs h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-grad-brand transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
            {['PDF', 'DOC', 'DOCX'].map((f) => (
              <span key={f} className="text-[11px] font-semibold rounded-full px-2.5 py-0.5 bg-surface-2 text-muted">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
      {replacing && (
        <div className="mt-3 text-center">
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors">
            <X className="w-3.5 h-3.5" /> Annuler
          </button>
        </div>
      )}
    </div>
  );
}

function PdfViewer({ url, name, isPdf }: { url: string; name: string; isPdf: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false);

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) wrapRef.current?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  return (
    <GlassCard
      ref={wrapRef}
      className={cn('relative p-0 overflow-hidden flex flex-col', fs ? 'h-screen rounded-none' : 'h-[78vh] min-h-[480px]')}
    >
      {/* Integrated toolbar */}
      <div className="h-12 px-3 sm:px-4 flex items-center gap-3 border-b border-border-brand bg-surface/70 backdrop-blur-sm shrink-0">
        <span className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </span>
        <span className="text-sm font-semibold text-ink truncate flex-1">{name}</span>
        <div className="flex items-center gap-1">
          <ToolbarBtn label="Télécharger" onClick={() => window.open(url, '_blank')} icon={Download} />
          <ToolbarBtn label="Ouvrir dans un onglet" onClick={() => window.open(url, '_blank')} icon={ExternalLink} />
          <ToolbarBtn label={fs ? 'Quitter le plein écran' : 'Plein écran'} onClick={toggleFullscreen} icon={fs ? Minimize2 : Maximize2} />
        </div>
      </div>

      {/* Document */}
      {isPdf ? (
        <iframe src={`${url}#toolbar=1&navpanes=0&view=FitH`} title={`Aperçu — ${name}`} className="w-full flex-1 bg-[#525659]" />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-surface">
          <span className="w-16 h-16 rounded-2xl bg-brand-light text-brand flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </span>
          <h3 className="font-display text-base font-bold text-ink">Aperçu indisponible pour ce format</h3>
          <p className="mt-1 text-sm text-muted max-w-xs">Les fichiers Word ne se prévisualisent pas ici. Ouvrez-le pour le consulter.</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="mt-5">
            <Button leftIcon={<ExternalLink className="w-4 h-4" />}>Ouvrir le CV</Button>
          </a>
        </div>
      )}

      {/* Floating fullscreen control */}
      {isPdf && (
        <button
          onClick={toggleFullscreen}
          aria-label={fs ? 'Quitter le plein écran' : 'Plein écran'}
          className="absolute bottom-4 right-4 glass rounded-full w-11 h-11 flex items-center justify-center text-ink shadow-lg hover:-translate-y-0.5 transition-transform"
        >
          {fs ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      )}
    </GlassCard>
  );
}

function ToolbarBtn({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: ElementType }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

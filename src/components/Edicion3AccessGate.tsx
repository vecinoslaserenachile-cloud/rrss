import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { EDICION3_INSTITUTIONAL } from '../data/edicion3Data';

export interface Edicion3AccessLogEntry {
  id: string;
  timestamp: string;
  visitorName: string;
  institution: string;
  role: string;
  status: 'granted' | 'denied';
  slideSlug: string;
  ip: string;
  userAgent: string;
  source: 'server' | 'local';
}

// SHA-256 digests for offline/Cloudflare Pages fallback validation (no plaintext key in client bundle)
const VALID_KEY_SHA256 = new Set([
  'da609ac6984722b8f7038c2ee80b2765bae797db928c236424acb8ed2fde78ae', // CONDOMINIOS2026
  '535a547329fc60954971148b484ad85464eaaba2ea5e8169d2118f3474097b86', // VLS-ED3-2026
]);

const LOCAL_LOGS_STORAGE_KEY = 'vls_edicion3_access_logs_v1';
export const EDICION3_SESSION_STORAGE_KEY = 'vls_edicion3_session_v1';

export interface Edicion3SessionState {
  visitorName: string;
  institution: string;
  role: string;
  sessionToken: string;
  grantedAt: string;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function loadLocalAccessLogs(): Edicion3AccessLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_LOGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalAccessLog(entry: Edicion3AccessLogEntry): Edicion3AccessLogEntry[] {
  const existing = loadLocalAccessLogs();
  const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 200);
  try {
    window.localStorage.setItem(LOCAL_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota issues
  }
  return updated;
}

export function mergeAccessLogs(
  serverLogs: Edicion3AccessLogEntry[],
  localLogs: Edicion3AccessLogEntry[]
): Edicion3AccessLogEntry[] {
  const byId = new Map<string, Edicion3AccessLogEntry>();
  [...localLogs, ...serverLogs].forEach((entry) => {
    byId.set(entry.id, entry);
  });
  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

interface Edicion3AccessGateProps {
  currentSlideSlug: string;
  onUnlocked: (session: Edicion3SessionState, logs: Edicion3AccessLogEntry[]) => void;
  onBackToPublicReports: () => void;
}

export const Edicion3AccessGate: React.FC<Edicion3AccessGateProps> = ({
  currentSlideSlug,
  onUnlocked,
  onBackToPublicReports,
}) => {
  const [visitorName, setVisitorName] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState('Dirección / Invitado');
  const [accessKey, setAccessKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = visitorName.trim();
    const cleanKey = accessKey.trim().toUpperCase();

    if (!cleanName) {
      setErrorMsg('Ingresa tu nombre completo o cargo para dejar registro de acceso.');
      return;
    }
    if (!cleanKey) {
      setErrorMsg('Ingresa la clave de acceso institucional.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/edicion3/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: cleanKey,
          visitorName: cleanName,
          institution: institution.trim() || 'No especificada',
          role,
          slideSlug: currentSlideSlug,
        }),
      });

      const contentType = res.headers.get('content-type')?.toLowerCase() ?? '';
      if (contentType.includes('application/json')) {
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          sessionToken?: string;
          entry?: Edicion3AccessLogEntry;
          logs?: Edicion3AccessLogEntry[];
        };

        if (data.entry) {
          saveLocalAccessLog(data.entry);
        }

        if (res.ok && data.ok && data.sessionToken) {
          const session: Edicion3SessionState = {
            visitorName: cleanName,
            institution: institution.trim() || 'No especificada',
            role,
            sessionToken: data.sessionToken,
            grantedAt: new Date().toISOString(),
          };
          onUnlocked(session, mergeAccessLogs(data.logs ?? [], loadLocalAccessLogs()));
          return;
        }

        setErrorMsg(data.error || 'Clave incorrecta. Intento registrado en la bitácora.');
        return;
      }

      // If non-JSON response (static hosting like Cloudflare Pages), verify via SHA-256 fallback
      throw new Error('STATIC_HOSTING_FALLBACK');
    } catch {
      const digest = await sha256Hex(cleanKey);
      const granted = VALID_KEY_SHA256.has(digest);
      const localEntry: Edicion3AccessLogEntry = {
        id: `ed3-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        visitorName: cleanName,
        institution: institution.trim() || 'No especificada',
        role,
        status: granted ? 'granted' : 'denied',
        slideSlug: currentSlideSlug,
        ip: 'navegador-web',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : 'Web',
        source: 'local',
      };

      const updatedLocal = saveLocalAccessLog(localEntry);

      if (granted) {
        const session: Edicion3SessionState = {
          visitorName: cleanName,
          institution: institution.trim() || 'No especificada',
          role,
          sessionToken: `local-${digest.slice(0, 16)}`,
          grantedAt: new Date().toISOString(),
        };
        onUnlocked(session, updatedLocal);
      } else {
        setErrorMsg('Clave de acceso incorrecta. Intento registrado en la bitácora local.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-y-auto bg-[#070D1B] px-4 py-16 text-white">
      <div className="dark-glass-panel w-full max-w-lg rounded-2xl border border-white/15 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="font-mono-tabular text-[11px] font-semibold tracking-wider text-[#F59E0B] uppercase">
              Acceso Restringido · Bitácora Auditada
            </p>
            <h1 className="font-display mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
              {EDICION3_INSTITUTIONAL.project}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              {EDICION3_INSTITUTIONAL.objective}
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]">
            <Lock className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 border-b border-white/10 pb-4 text-xs text-slate-300">
          <div className="font-semibold text-white">
            Dirección Institucional: {EDICION3_INSTITUTIONAL.director}
          </div>
          <div className="mt-0.5 text-slate-400">
            {EDICION3_INSTITUTIONAL.organization} · 13 Autoridades Región de Coquimbo
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="ed3-visitor-name" className="block text-xs font-semibold text-slate-200">
              Nombre completo o identificación *
            </label>
            <input
              id="ed3-visitor-name"
              type="text"
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Ej: Abg. Víctor Pérez / Director Regional"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ed3-institution" className="block text-xs font-semibold text-slate-200">
                Institución / Medio
              </label>
              <input
                id="ed3-institution"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Ej: condominioschilenos.cl"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="ed3-role" className="block text-xs font-semibold text-slate-200">
                Perfil de consulta
              </label>
              <select
                id="ed3-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0D162C] px-3 text-sm text-white focus:border-[#00F0FF] focus:outline-none"
              >
                <option value="Dirección / Invitado">Dirección / Invitado</option>
                <option value="Equipo Editorial">Equipo Editorial</option>
                <option value="Autoridad / Asesoría">Autoridad / Asesoría</option>
                <option value="Auditoría Externa">Auditoría Externa</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="ed3-access-key" className="block text-xs font-semibold text-slate-200">
              Clave de acceso *
            </label>
            <div className="relative mt-1.5">
              <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#F59E0B]" />
              <input
                id="ed3-access-key"
                type={showKey ? 'text' : 'password'}
                required
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Ingresa la clave institucional"
                className="min-h-[44px] w-full rounded-xl border border-white/15 bg-white/[0.05] pr-11 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-[#F59E0B] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey((prev) => !prev)}
                aria-label={showKey ? 'Ocultar clave' : 'Mostrar clave'}
                className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={onBackToPublicReports}
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Reportes Públicos
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-5 text-xs font-bold text-[#060B19] transition-colors hover:bg-amber-400 disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{submitting ? 'Validando acceso...' : 'Validar Clave y Registrar Ingreso'}</span>
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-400">
            Cada ingreso autorizado o fallido deja registro con fecha, identificación, dispositivo e IP en la bitácora institucional del Reporte Digital Noviembre 2026.
          </p>
        </form>
      </div>
    </div>
  );
};

interface Edicion3AccessLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Edicion3SessionState;
  logs: Edicion3AccessLogEntry[];
  onRefreshLogs: () => void;
  onLockSession: () => void;
}

export const Edicion3AccessLogModal: React.FC<Edicion3AccessLogModalProps> = ({
  isOpen,
  onClose,
  session,
  logs,
  onRefreshLogs,
  onLockSession,
}) => {
  if (!isOpen) return null;

  const exportCsv = () => {
    const headers = ['Fecha_Hora', 'Visitante', 'Institucion', 'Perfil', 'Estado', 'Lamina', 'IP', 'Origen'];
    const escapeCsv = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = logs.map((l) =>
      [
        l.timestamp,
        l.visitorName,
        l.institution,
        l.role,
        l.status === 'granted' ? 'Autorizado' : 'Denegado',
        l.slideSlug,
        l.ip,
        l.source,
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Registro_Accesos_Edicion3_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div
      data-html2canvas-ignore="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bitácora de Registro de Accesos Edición N° 3"
        onClick={(e) => e.stopPropagation()}
        className="dark-glass-panel flex max-h-[85dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#070D1B] text-white shadow-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#F59E0B]">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Bitácora de Auditoría · Edición N° 3</span>
            </div>
            <h2 className="font-display mt-0.5 text-lg font-bold text-white">
              Registro de Accesos ({logs.length})
            </h2>
            <p className="text-xs text-slate-400">
              Sesión activa: <span className="font-semibold text-slate-200">{session.visitorName}</span> ({session.institution})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefreshLogs}
              className="min-h-[38px] rounded-lg border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Actualizar
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#10B981] px-3 text-xs font-bold text-[#060B19] hover:bg-emerald-400"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
            <button
              type="button"
              onClick={onLockSession}
              className="min-h-[38px] rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
            >
              Bloquear
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar bitácora"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="editorial-scroll flex-1 overflow-y-auto p-4 sm:p-5">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Aún no hay registros almacenados.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((entry) => {
                const granted = entry.status === 'granted';
                const formattedDate = new Date(entry.timestamp).toLocaleString('es-CL', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                return (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {granted ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                        )}
                        <span className="font-semibold text-white">{entry.visitorName}</span>
                        <span className="text-slate-400">· {entry.institution}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span className="font-mono-tabular">{formattedDate}</span>
                        <span>{entry.role}</span>
                        <span>Lámina: {entry.slideSlug}</span>
                        <span className="font-mono-tabular">IP: {entry.ip}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono-tabular text-[11px] font-bold ${
                          granted ? 'text-[#10B981]' : 'text-rose-400'
                        }`}
                      >
                        {granted ? 'AUTORIZADO' : 'DENEGADO'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                        <UserCheck className="h-3 w-3" />
                        {entry.source === 'server' ? 'Servidor' : 'Local'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

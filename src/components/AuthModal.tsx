import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Settings,
  Cloud,
} from 'lucide-react';
import { Modal } from './Modal';
import {
  isSupabaseConfigured,
  pullFromSupabase,
  pushLocalSnapshotToSupabase,
  signInWithEmail,
  signUpWithEmail,
} from '../services/supabase';
import { StorageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  onGoToSupabaseSettings: () => void;
}

type AuthTab = 'signin' | 'signup';

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onGoToSupabaseSettings,
}) => {
  const [tab, setTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setInfoMsg(null);
      setPassword('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      const storage = StorageService.getInstance();

      if (tab === 'signup') {
        const res = await signUpWithEmail(
          trimmedEmail,
          password,
          displayName.trim() || storage.getProfile().display_name
        );
        if (res.error) {
          setErrorMsg(res.error);
          return;
        }
        if (!res.session || !res.user) {
          setInfoMsg(
            'Pendaftaran berhasil. Cek kotak masuk emailmu untuk konfirmasi akun sebelum masuk.'
          );
          setTab('signin');
          return;
        }

        await syncSessionData(res.user);
        onAuthSuccess(res.user);
        onClose();
        return;
      }

      const res = await signInWithEmail(trimmedEmail, password);
      if (res.error || !res.user) {
        setErrorMsg(res.error || 'Gagal masuk ke akun.');
        return;
      }

      await syncSessionData(res.user);
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyambungkan akun.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const syncSessionData = async (user: User) => {
    const storage = StorageService.getInstance();
    storage.setCloudUserId(user.id);

    const remote = await pullFromSupabase(user.id);
    const local = storage.exportLocalSnapshot();
    const remoteEmpty = remote.budgets.length === 0 && remote.expenses.length === 0;
    const localHasData = local.budgets.length > 0 || local.expenses.length > 0;

    if (remoteEmpty && localHasData) {
      const pushed = await pushLocalSnapshotToSupabase(user.id, local);
      storage.hydrateFromCloudSnapshot(pushed, user.email);
    } else {
      storage.hydrateFromCloudSnapshot(remote, user.email);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="auth-modal-title" maxWidthClass="max-w-md">
      <div className="p-4 sm:p-5 border-b border-[#E2DDD3] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#0F5132] border border-emerald-200 flex items-center justify-center flex-shrink-0">
            <Cloud className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="auth-modal-title" className="text-base sm:text-lg font-extrabold text-zinc-900 truncate">
              Akun Cloud Supabase
            </h2>
            <p className="text-[11px] text-zinc-600 truncate">
              Sinkronkan catatan uang saku antar perangkat
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-[#F2EDE4] min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          aria-label="Tutup dialog akun cloud"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {!configured ? (
        <div className="p-5 space-y-4">
          <div className="p-4 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl space-y-2">
            <p className="text-sm font-bold text-zinc-900">Koneksi Supabase Belum Diisi</p>
            <p className="text-xs text-zinc-700 leading-relaxed">
              Masukkan <strong>Project URL</strong> dan <strong>Anon Public Key</strong> proyek Supabase milikmu di menu Pengaturan agar fitur daftar, masuk, dan sinkronisasi database dapat digunakan.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-bold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToSupabaseSettings();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-extrabold text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-xl min-h-[44px]"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              <span>Atur Supabase</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div
            role="tablist"
            aria-label="Mode autentikasi akun"
            className="flex bg-[#F2EDE4] p-1 rounded-xl border border-[#E2DDD3]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              onClick={() => {
                setTab('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-colors min-h-[44px] ${
                tab === 'signin' ? 'bg-zinc-900 text-[#FAF7F2]' : 'text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              onClick={() => {
                setTab('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-colors min-h-[44px] ${
                tab === 'signup' ? 'bg-zinc-900 text-[#FAF7F2]' : 'text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Daftar Akun</span>
            </button>
          </div>

          {tab === 'signup' && (
            <div>
              <label htmlFor="auth-display-name" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                <span>Nama Tampilan</span>
              </label>
              <input
                id="auth-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama panggilanmu"
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
              <span>Alamat Email</span>
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="nama@email.com"
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-bold text-zinc-700 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
              <span>Kata Sandi</span>
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Minimal 6 karakter"
              className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
            />
          </div>

          {errorMsg && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div role="status" className="p-3 bg-[#ECFDF5] border border-emerald-200 text-[#0F5132] rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{infoMsg}</span>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-zinc-800 bg-white border border-[#D4CEC2] hover:bg-[#F2EDE4] rounded-xl min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-2.5 px-4 text-xs font-extrabold text-white bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-60 rounded-xl border border-zinc-900 min-h-[44px]"
            >
              {submitting
                ? 'Memproses...'
                : tab === 'signin'
                ? 'Masuk & Sinkronkan'
                : 'Daftar & Sinkronkan'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

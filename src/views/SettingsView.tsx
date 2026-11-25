import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Database,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Code2,
  X,
  AlertCircle,
  Cloud,
  LogIn,
  LogOut,
} from 'lucide-react';
import { StorageService } from '../services/storage';
import {
  clearSupabaseConfig,
  getSupabaseClient,
  getSupabaseConfig,
  isSupabaseConfigured,
  saveSupabaseConfig,
} from '../services/supabase';
import sqlSchemaText from '../services/db-schema.sql?raw';
import { Modal } from '../components/Modal';

interface Props {
  onDataChanged: () => void;
  cloudUserEmail?: string | null;
  syncStatus?: { state: 'idle' | 'syncing' | 'synced' | 'error'; message?: string | null };
  onOpenAuth: () => void;
  onSyncNow: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSupabaseConfigChanged: () => void;
}

export const SettingsView: React.FC<Props> = ({
  onDataChanged,
  cloudUserEmail,
  syncStatus,
  onOpenAuth,
  onSyncNow,
  onSignOut,
  onSupabaseConfigChanged,
}) => {
  const storage = StorageService.getInstance();
  const profile = storage.getProfile();
  const initialConfig = getSupabaseConfig();

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const [supabaseUrl, setSupabaseUrl] = useState(() =>
    initialConfig.source === 'local' ? initialConfig.url : ''
  );
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() =>
    initialConfig.source === 'local' ? initialConfig.anonKey : ''
  );
  const [supabaseStatus, setSupabaseStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);

  const [confirmDemoOpen, setConfirmDemoOpen] = useState(false);
  const [demoLoadedMsg, setDemoLoadedMsg] = useState(false);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [clearText, setClearText] = useState('');
  const [clearError, setClearError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();
  const activeConfig = getSupabaseConfig();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    storage.saveProfile({
      ...profile,
      display_name: displayName.trim() || 'Mahasiswa CatatDuit',
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    onDataChanged();
  };

  const handleSaveAndTestSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = supabaseUrl.trim();
    const key = supabaseAnonKey.trim();

    if (!url || !key) {
      clearSupabaseConfig();
      onSupabaseConfigChanged();
      setSupabaseStatus({ type: 'ok', text: 'Kredensial lokal dikosongkan. Aplikasi berjalan lokal atau memakai .env jika tersedia.' });
      return;
    }

    if (!/^https:\/\/.+\..+/.test(url)) {
      setSupabaseStatus({ type: 'err', text: 'URL harus diawali https:// dan valid.' });
      return;
    }

    saveSupabaseConfig(url, key);
    onSupabaseConfigChanged();
    setTestingSupabase(true);
    setSupabaseStatus(null);

    try {
      const client = getSupabaseClient();
      if (!client) {
        setSupabaseStatus({ type: 'err', text: 'Konfigurasi Supabase belum valid.' });
        return;
      }
      const { error } = await client.auth.getSession();
      if (error) {
        setSupabaseStatus({
          type: 'err',
          text: `Kredensial tersimpan, tetapi koneksi mengembalikan pesan: ${error.message}`,
        });
      } else {
        setSupabaseStatus({
          type: 'ok',
          text: 'Kredensial tersimpan dan endpoint Supabase merespons normal. Kamu sekarang bisa masuk atau daftar akun.',
        });
      }
    } catch {
      setSupabaseStatus({
        type: 'err',
        text: 'Kredensial tersimpan, tetapi tidak dapat menjangkau server Supabase sekarang.',
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleLoadDemoRaka = () => {
    storage.seedDemoData();
    setConfirmDemoOpen(false);
    setDemoLoadedMsg(true);
    setTimeout(() => setDemoLoadedMsg(false), 3000);
    onDataChanged();
  };

  const handleClearAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (clearText.trim() !== 'HAPUS') {
      setClearError('Ketik kata HAPUS dengan huruf kapital untuk melanjutkan.');
      return;
    }
    storage.clearAllData();
    setConfirmClearOpen(false);
    setClearText('');
    setClearError(null);
    onDataChanged();
  };

  return (
    <div className="space-y-6 pb-2 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Akun & Pengaturan</h1>
        <p className="text-xs text-zinc-600 mt-0.5">Kelola profil, data simulasi, koneksi Supabase, dan privasi perangkat</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-[#D4CEC2] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2DDD3] pb-3">
              <User className="w-5 h-5 text-[#0F5132]" aria-hidden="true" />
              <h2 className="text-base font-bold text-zinc-900">Profil Saya</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label htmlFor="profile-display-name" className="block text-xs font-bold text-zinc-700 mb-1">
                  Nama Tampilan
                </label>
                <input
                  id="profile-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama panggilanmu"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm font-semibold text-zinc-900 outline-none focus:border-[#C2410C] focus:bg-white min-h-[44px]"
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs text-zinc-600 pt-1">
                <span>Zona waktu: Asia/Jakarta (WIB)</span>
                <span className="font-mono text-[11px] truncate max-w-[160px]" title={profile.id}>
                  ID: {profile.id}
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto py-2.5 px-5 text-xs font-bold text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-xl transition-colors min-h-[44px]"
              >
                {isSaved ? 'Nama Tersimpan' : 'Simpan Nama'}
              </button>
            </form>
          </div>

          <div className="bg-[#F2EDE4] border border-[#D4CEC2] rounded-2xl p-5 space-y-3">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-[#0F5132]" aria-hidden="true" />
                <span>Contoh Data Simulasi (Raka)</span>
              </h2>
              <p className="text-xs text-zinc-700 leading-relaxed">
                Isi data contoh sesuai profil PRD (uang saku Rp2.000.000, target tabungan Rp200.000, batas kategori, dan 5 transaksi contoh) untuk mencoba aplikasi.
              </p>
            </div>

            {demoLoadedMsg && (
              <p role="status" className="text-xs font-bold text-[#0F5132]">
                Data simulasi Raka berhasil dimuat.
              </p>
            )}

            {!confirmDemoOpen ? (
              <button
                type="button"
                onClick={() => setConfirmDemoOpen(true)}
                className="py-2.5 px-4 text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-50 border border-[#D4CEC2] rounded-xl transition-colors min-h-[44px]"
              >
                Muat Data Simulasi
              </button>
            ) : (
              <div className="p-3 bg-white rounded-xl border border-[#D4CEC2] space-y-2.5">
                <p className="text-xs font-semibold text-zinc-800">
                  Data lokal saat ini akan diganti dengan data simulasi Raka. Lanjutkan?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDemoOpen(false)}
                    className="flex-1 py-2 text-xs font-semibold text-zinc-700 bg-[#FAF7F2] border border-[#D4CEC2] rounded-lg min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDemoRaka}
                    className="flex-1 py-2 text-xs font-bold text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg min-h-[44px]"
                  >
                    Ya, Muat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D4CEC2] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#0F5132]" aria-hidden="true" />
                <h2 className="text-base font-bold text-zinc-900">Koneksi Supabase (Opsional)</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="text-xs font-bold text-[#0F5132] hover:bg-[#ECFDF5] px-3 py-1.5 rounded-xl flex items-center gap-1 min-h-[44px]"
              >
                <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Lihat Skema SQL</span>
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Saat ini seluruh catatan tersimpan cepat secara lokal di browser. Hubungkan proyek Supabase untuk mengaktifkan masuk akun dan sinkronisasi database antar perangkat.
            </p>

            <div className="p-3.5 bg-[#FAF7F2] border border-[#E2DDD3] rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <Cloud className="w-4 h-4 text-[#0F5132] flex-shrink-0" aria-hidden="true" />
                  <span className="text-xs font-bold text-zinc-900 truncate">
                    {cloudUserEmail ? `Masuk sebagai ${cloudUserEmail}` : 'Akun Cloud Belum Masuk'}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                    cloudUserEmail
                      ? 'bg-[#ECFDF5] text-[#0F5132] border-emerald-200'
                      : 'bg-[#F2EDE4] text-zinc-700 border-[#D4CEC2]'
                  }`}
                >
                  {cloudUserEmail ? 'Terhubung' : configured ? 'Siap Masuk' : 'Belum Dikonfigurasi'}
                </span>
              </div>

              {syncStatus?.message && (
                <p
                  role="status"
                  className={`text-xs font-medium ${
                    syncStatus.state === 'error' ? 'text-rose-800' : 'text-[#0F5132]'
                  }`}
                >
                  {syncStatus.message}
                </p>
              )}

              {cloudUserEmail ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={syncingNow}
                    onClick={async () => {
                      setSyncingNow(true);
                      try {
                        await onSyncNow();
                      } finally {
                        setSyncingNow(false);
                      }
                    }}
                    className="flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold text-white bg-[#0F5132] hover:bg-[#0B3D26] disabled:opacity-60 rounded-xl min-h-[44px]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingNow ? 'animate-spin' : ''}`} aria-hidden="true" />
                    <span>{syncingNow ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex items-center gap-1.5 py-2 px-3.5 text-xs font-bold text-zinc-800 bg-white hover:bg-[#F2EDE4] border border-[#D4CEC2] rounded-xl min-h-[44px]"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="flex items-center gap-1.5 py-2 px-4 text-xs font-extrabold text-white bg-[#C2410C] hover:bg-[#9A3412] rounded-xl border border-zinc-900 min-h-[44px]"
                  >
                    <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Masuk / Daftar Akun</span>
                  </button>
                  {activeConfig.source === 'env' && (
                    <span className="text-[11px] font-semibold text-[#0F5132]">
                      Menggunakan kredensial dari .env
                    </span>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveAndTestSupabase} className="space-y-3">
              <div>
                <label htmlFor="sb-url" className="block text-xs font-bold text-zinc-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  id="sb-url"
                  type="url"
                  placeholder="https://project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-xs font-mono text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="sb-anon" className="block text-xs font-bold text-zinc-700 mb-1">
                  Supabase Anon Key (Public)
                </label>
                <input
                  id="sb-anon"
                  type="password"
                  placeholder="Tempel anon public key dari dashboard Supabase"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-xs font-mono text-zinc-900 outline-none focus:border-[#C2410C] min-h-[44px]"
                />
              </div>

              {supabaseStatus && (
                <div
                  role="status"
                  className={`p-3 rounded-xl text-xs border ${
                    supabaseStatus.type === 'ok'
                      ? 'bg-[#ECFDF5] border-emerald-200 text-[#0F5132]'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {supabaseStatus.text}
                </div>
              )}

              <button
                type="submit"
                disabled={testingSupabase}
                className="py-2.5 px-4 text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 rounded-xl transition-colors min-h-[44px]"
              >
                {testingSupabase ? 'Menguji Koneksi...' : 'Simpan & Uji Koneksi'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#D4CEC2] space-y-3">
            <div className="flex items-center gap-2 border-b border-[#E2DDD3] pb-3">
              <ShieldCheck className="w-5 h-5 text-[#0F5132]" aria-hidden="true" />
              <h2 className="text-base font-bold text-zinc-900">Privasi & Keamanan</h2>
            </div>

            <ul className="text-xs text-zinc-700 space-y-2 list-disc pl-4 leading-relaxed">
              <li>
                <strong>OCR diproses di browser:</strong> gambar struk dan screenshot e-wallet dibaca langsung lewat Tesseract.js di perangkatmu, tidak pernah dikirim ke server.
              </li>
              <li>
                <strong>Tanpa pelacak iklan:</strong> catatan keuangan tidak dibagikan ke pihak ketiga.
              </li>
              <li>
                <strong>Khusus usia 18 tahun ke atas:</strong> dirancang untuk mahasiswa pengelola uang saku mandiri.
              </li>
            </ul>
          </div>

          <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-800" aria-hidden="true" />
              <h2 className="text-sm font-bold text-rose-950">Hapus Semua Data Lokal</h2>
            </div>
            <p className="text-xs text-rose-900 leading-relaxed">
              Tindakan ini menghapus seluruh transaksi, kategori khusus, dan periode anggaran dari perangkat ini dan tidak bisa dibatalkan.
            </p>

            {!confirmClearOpen ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmClearOpen(true);
                  setClearError(null);
                  setClearText('');
                }}
                className="py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl transition-colors min-h-[44px]"
              >
                Hapus Semua Data & Riwayat
              </button>
            ) : (
              <form onSubmit={handleClearAll} className="p-3.5 bg-white rounded-xl border border-rose-300 space-y-3">
                <div>
                  <label htmlFor="confirm-clear-input" className="block text-xs font-bold text-zinc-900 mb-1">
                    Ketik <span className="font-mono text-rose-700">HAPUS</span> untuk konfirmasi:
                  </label>
                  <input
                    id="confirm-clear-input"
                    type="text"
                    value={clearText}
                    onChange={(e) => {
                      setClearText(e.target.value);
                      setClearError(null);
                    }}
                    placeholder="HAPUS"
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl text-sm font-bold text-zinc-900 outline-none focus:border-rose-700 min-h-[44px]"
                  />
                </div>
                {clearError && (
                  <div role="alert" className="text-xs text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>{clearError}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(false)}
                    className="flex-1 py-2 text-xs font-semibold text-zinc-800 bg-[#FAF7F2] border border-[#D4CEC2] rounded-xl min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl min-h-[44px]"
                  >
                    Konfirmasi Hapus
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
        labelledBy="sql-modal-title"
        maxWidthClass="max-w-xl"
      >
        <div className="p-4 sm:p-5 border-b border-[#E2DDD3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#0F5132]" aria-hidden="true" />
            <h2 id="sql-modal-title" className="text-base font-bold text-zinc-900">
              Skema SQL Database Supabase
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlModal(false)}
            className="p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-[#F2EDE4] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Tutup dialog skema SQL"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <pre className="p-3.5 bg-zinc-900 text-emerald-300 text-xs rounded-xl font-mono overflow-x-auto leading-relaxed">
            {sqlSchemaText}
          </pre>
        </div>

        <div className="p-4 sm:p-5 border-t border-[#E2DDD3] bg-[#FAF7F2] flex justify-between items-center gap-2">
          <span className="text-xs text-zinc-600">Termasuk RLS dan relasi antar tabel</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(sqlSchemaText);
              setCopiedSql(true);
              setTimeout(() => setCopiedSql(false), 2000);
            }}
            className="flex items-center gap-1.5 py-2.5 px-4 bg-[#0F5132] hover:bg-[#0B3D26] text-white font-bold text-xs rounded-xl min-h-[44px]"
          >
            {copiedSql ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            <span>{copiedSql ? 'Tersalin' : 'Salin Kode SQL'}</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

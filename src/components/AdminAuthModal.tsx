import React, { useState, useEffect, useRef } from "react";
import { Lock, KeyRound, Eye, EyeOff, X, AlertCircle, ShieldCheck } from "lucide-react";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
}

const ADMIN_PASSWORD = "kikyadmin";

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = "Akses Menu Administrator"
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError(null);
      setShowPassword(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Silakan masukkan password admin.");
      return;
    }

    if (password === ADMIN_PASSWORD) {
      setError(null);
      setPassword("");
      onSuccess();
      onClose();
    } else {
      setError("Password salah! Akses ditolak.");
      setPassword("");
      inputRef.current?.focus();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/60 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-100">
                Verifikasi Administrator
              </h3>
              <p className="text-[11px] text-neutral-400">{actionTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs relative z-10">
          <div className="text-neutral-300 text-[11px] leading-relaxed">
            Fitur ini dilindungi. Masukkan password administrator untuk melanjutkan:
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-neutral-400">
              Password Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Ketik password..."
                className="w-full pl-9 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-neutral-100 placeholder-neutral-500 text-xs transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl border border-neutral-700 text-xs transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/30 inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Buka Akses</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

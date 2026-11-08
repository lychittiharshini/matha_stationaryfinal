import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBackToStore: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onBackToStore,
}) => {
  const { loginWithAdminCredentials, authError, setAuthError, isLoading } = useAuth();
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId.trim()) {
      setAuthError('Please enter your Admin ID.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your admin password.');
      return;
    }

    setIsSubmitting(true);
    const ok = await loginWithAdminCredentials(adminId.trim(), password);
    setIsSubmitting(false);

    if (ok) {
      onSuccess();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#F7F3EB]">
      <div className="w-full max-w-md bg-white rounded-3xl border-2 border-[#1F3B2E] shadow-2xl overflow-hidden p-8 sm:p-10">
        {/* Top Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#1F3B2E] text-[#CBB3E8] flex items-center justify-center mx-auto mb-4 shadow-md">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="font-brand-title font-bold text-2xl text-[#1F3B2E] tracking-tight">
            SREE DURGA MATA
          </h1>
          <p className="text-xs font-semibold text-[#1F3B2E]/70 uppercase tracking-wider mt-1">
            Store Administration Login
          </p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-start gap-2.5 animate-fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-relaxed">{authError}</span>
          </div>
        )}

        {/* Login Form: Admin ID, Password, Login Button ONLY */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#1F3B2E] uppercase tracking-wider mb-1.5">
              Admin ID / Username
            </label>
            <input
              type="text"
              autoComplete="username"
              value={adminId}
              onChange={(e) => {
                setAdminId(e.target.value);
                if (authError) setAuthError(null);
              }}
              placeholder="Enter Admin ID"
              className="w-full px-4 py-3 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-sm text-[#1F3B2E] font-medium placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E] transition-all"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F3B2E] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (authError) setAuthError(null);
              }}
              placeholder="Enter Password"
              className="w-full px-4 py-3 rounded-xl bg-[#F7F3EB] border border-[#D8C7AA] text-sm text-[#1F3B2E] font-medium placeholder-[#1F3B2E]/40 focus:outline-none focus:ring-2 focus:ring-[#1F3B2E] transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full py-3.5 px-4 bg-[#1F3B2E] hover:bg-[#2C5241] text-[#E8DCC6] font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#CBB3E8]" />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Login to Admin Dashboard</span>
            )}
          </button>
        </form>

        {/* Discreet Back to Store Link */}
        <div className="mt-8 pt-6 border-t border-[#F7F3EB] text-center">
          <button
            type="button"
            onClick={onBackToStore}
            className="text-xs font-semibold text-[#1F3B2E]/60 hover:text-[#1F3B2E] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Store</span>
          </button>
        </div>
      </div>
    </div>
  );
};

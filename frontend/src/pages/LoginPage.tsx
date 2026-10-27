import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('your@college.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, isBackendConnected, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // If user kept the placeholder bullets, use default seed password
      const actualPassword = password === '••••••••••••' ? 'password123' : password;
      await login(email, actualPassword);

      // Route based on role
      const lower = email.toLowerCase();
      if (lower.includes('admin')) {
        navigate('/admin');
      } else if (lower.includes('faculty')) {
        navigate('/faculty/requests');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string, roleName: 'STUDENT' | 'FACULTY' | 'ADMIN') => {
    setEmail(roleEmail);
    setPassword('password123');
    switchRole(roleName);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F3F7FC]">
      {/* Left Panel - Campus Hero (50% on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#102448] overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Image with Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#102448] via-[#102448]/60 to-[#102448]/80" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2166F3] flex items-center justify-center font-bold text-xl text-white shadow-md">
            S
          </div>
          <span className="text-2xl font-bold tracking-tight">Smartly</span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
            Access Flow Control Management System
          </h1>
          <p className="text-slate-200 text-base leading-relaxed mb-6 font-normal">
            Manage classrooms, laboratories and campus resources efficiently.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-[#20A875]" />
            <span>Campus Real-Time Scheduling Engine</span>
          </div>
        </div>

        {/* Bottom Caption */}
        <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-slate-300 font-medium">
            Smart Campus. Better Access. Brighter Learning.
          </p>
          <span className="text-[11px] text-slate-400">v2.0 Enterprise</span>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Smartly Brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#2166F3] flex items-center justify-center font-bold text-lg text-white">
              S
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#102448]">Smartly</h2>
              <p className="text-[11px] text-[#718096]">Access Flow Control Management System</p>
            </div>
          </div>

          {/* Desktop Logo Header */}
          <div className="hidden lg:flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#2166F3] flex items-center justify-center font-bold text-base text-white">
              S
            </div>
            <div>
              <span className="text-lg font-bold text-[#102448]">Smartly</span>
              <p className="text-[10px] text-[#718096] -mt-0.5">Access Flow Control Management System</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#17243B] tracking-tight">Welcome Back</h2>
            <p className="text-[13px] text-[#718096] mt-1">
              Sign in to your institutional account.
            </p>
          </div>

          {/* Backend Connectivity Notice */}
          <div className="mb-4">
            {isBackendConnected ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#EAF7F0] border border-[#B7E7D1] text-[11px] text-[#20A875]">
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span>Connected to live backend at <strong>http://localhost:5000/api</strong></span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FEF7EC] border border-[#FCE1B6] text-[11px] text-[#E09214]">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>Backend offline (Demo credentials active)</span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FDEEF0] border border-[#F9C9CF] text-[#E65363] text-xs flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[12px] font-semibold text-[#17243B] mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718096]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@college.edu"
                  required
                  className="w-full bg-white border border-[#E1E8F0] rounded-lg pl-10 pr-3.5 py-2.5 text-xs text-[#17243B] placeholder-[#718096] focus:outline-none focus:border-[#2166F3] focus:ring-1 focus:ring-[#2166F3] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[12px] font-semibold text-[#17243B] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718096]"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-white border border-[#E1E8F0] rounded-lg pl-10 pr-10 py-2.5 text-xs text-[#17243B] placeholder-[#718096] focus:outline-none focus:border-[#2166F3] focus:ring-1 focus:ring-[#2166F3] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#17243B]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-[#718096]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E1E8F0] text-[#2166F3] focus:ring-[#2166F3] h-3.5 w-3.5"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('For password resets, contact your campus systems administrator.');
                }}
                className="text-[#2166F3] hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2166F3] hover:bg-[#1a54cc] text-white py-2.5 px-4 rounded-lg font-semibold text-xs tracking-wide transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Fillers */}
          <div className="mt-6 pt-5 border-t border-[#E1E8F0]">
            <p className="text-[11px] font-semibold text-[#718096] uppercase tracking-wider mb-2">
              Quick Role Sign-In
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student@smartly.local', 'STUDENT')}
                className="px-2.5 py-1.5 rounded-md border border-[#E1E8F0] bg-[#F8FAFC] hover:bg-[#EDF4FF] hover:border-[#2166F3] text-[11px] font-medium text-[#17243B] transition-colors text-center"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('faculty@smartly.local', 'FACULTY')}
                className="px-2.5 py-1.5 rounded-md border border-[#E1E8F0] bg-[#F8FAFC] hover:bg-[#EDF4FF] hover:border-[#2166F3] text-[11px] font-medium text-[#17243B] transition-colors text-center"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@smartly.local', 'ADMIN')}
                className="px-2.5 py-1.5 rounded-md border border-[#E1E8F0] bg-[#F8FAFC] hover:bg-[#EDF4FF] hover:border-[#2166F3] text-[11px] font-medium text-[#17243B] transition-colors text-center"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[11px] text-[#718096]">
              Use your institutional account to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

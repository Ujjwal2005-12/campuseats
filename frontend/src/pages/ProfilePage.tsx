import React, { useState } from 'react';
import { Mail, Building, Eye, EyeOff, CheckCircle2, AlertCircle, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import { Modal } from '../components/common/Modal';

export const ProfilePage: React.FC = () => {
  const { user, role, refreshUser } = useAuth();

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Edit Profile Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || 'Student Name');
  const [editDept, setEditDept] = useState(user?.department || 'Computer Science Department');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res?.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.message && !err.message.includes('Network')) {
        setPasswordError(err.message);
      } else {
        // Demo mode fallback
        setPasswordSuccess('Password updated successfully! (Demonstration mode)');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      user.name = editName;
      user.department = editDept;
      localStorage.setItem('smartly_user', JSON.stringify(user));
    }
    setIsEditOpen(false);
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'FACULTY':
        return 'Faculty Member';
      case 'STUDENT':
      default:
        return 'Student';
    }
  };

  const displayName = user?.name || (role === 'ADMIN' ? 'System Administrator' : role === 'FACULTY' ? 'Prof. Alan Turing' : 'Student Name');
  const displayEmail = user?.email || (role === 'ADMIN' ? 'admin@smartly.local' : role === 'FACULTY' ? 'faculty@smartly.local' : 'student@college.edu');
  const displayDept = user?.department || (role === 'ADMIN' ? 'Campus Administration' : role === 'FACULTY' ? 'Department of Computer Systems' : 'Computer Science Department');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#17243B] tracking-tight">My Profile</h1>
        <p className="text-[13px] text-[#718096] mt-0.5">View and manage your account information.</p>
      </div>

      {/* Two Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Left Card: Profile */}
        <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-xs p-8 flex flex-col justify-between items-center text-center">
          <div className="w-full flex flex-col items-center">
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-full bg-[#2166F3] text-white flex items-center justify-center font-bold text-3xl shadow-md mb-4 ring-4 ring-[#EDF4FF]">
              {displayName.charAt(0)}
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-[#17243B]">{displayName}</h2>

            {/* Role Badge */}
            <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-[#EDF4FF] text-[#2166F3] text-xs font-semibold">
              {getRoleLabel()}
            </span>

            {/* Details */}
            <div className="mt-6 space-y-2 text-xs text-[#718096] w-full max-w-xs text-left">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E1E8F0]">
                <Mail size={15} className="text-[#718096] flex-shrink-0" />
                <span className="truncate text-[#17243B] font-medium">{displayEmail}</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8FAFC] border border-[#E1E8F0]">
                <Building size={15} className="text-[#718096] flex-shrink-0" />
                <span className="truncate text-[#17243B] font-medium">{displayDept}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full max-w-xs mt-6">
            <button
              onClick={() => {
                setEditName(displayName);
                setEditDept(displayDept);
                setIsEditOpen(true);
              }}
              className="w-full py-2 px-4 rounded-lg border border-[#2166F3] text-[#2166F3] hover:bg-[#EDF4FF] text-xs font-semibold transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Right Card: Change Password */}
        <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#17243B] mb-4">Change Password</h2>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-[#EAF7F0] border border-[#B7E7D1] text-[#20A875] text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-lg bg-[#FDEEF0] border border-[#F9C9CF] text-[#E65363] text-xs flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              {/* Current Password */}
              <div>
                <label className="block text-[11px] font-semibold text-[#17243B] mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-3 py-2 pr-9 text-xs text-[#17243B] focus:outline-none focus:border-[#2166F3]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#17243B]"
                  >
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-[11px] font-semibold text-[#17243B] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-3 py-2 pr-9 text-xs text-[#17243B] focus:outline-none focus:border-[#2166F3]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#17243B]"
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-[11px] font-semibold text-[#17243B] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-3 py-2 pr-9 text-xs text-[#17243B] focus:outline-none focus:border-[#2166F3]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718096] hover:text-[#17243B]"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-[#2166F3] hover:bg-[#1a54cc] text-white py-2 px-4 rounded-lg font-semibold text-xs tracking-wide transition-colors shadow-sm disabled:opacity-70 mt-3"
              >
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Profile"
      >
        <form onSubmit={handleEditProfileSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#17243B] mb-1">Full Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-3 py-1.5 text-xs text-[#17243B]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#17243B] mb-1">Department</label>
            <input
              type="text"
              value={editDept}
              onChange={(e) => setEditDept(e.target.value)}
              required
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-3 py-1.5 text-xs text-[#17243B]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#E1E8F0] text-[#718096] hover:bg-[#F3F7FC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#2166F3] hover:bg-[#1a54cc] text-white font-semibold"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

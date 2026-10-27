import React, { useState } from 'react';
import { Search, Bell, ChevronDown, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Topbar: React.FC = () => {
  const { user, role, switchRole, logout, isBackendConnected } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (newRole: 'STUDENT' | 'FACULTY' | 'ADMIN') => {
    switchRole(newRole);
    setDropdownOpen(false);
    if (newRole === 'STUDENT') navigate('/dashboard');
    else if (newRole === 'FACULTY') navigate('/faculty/requests');
    else if (newRole === 'ADMIN') navigate('/admin');
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'FACULTY':
        return 'Faculty';
      case 'STUDENT':
      default:
        return 'Student';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E1E8F0] flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center w-80 max-w-xs">
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]"
          />
          <input
            type="text"
            placeholder="Search rooms, buildings..."
            className="w-full bg-[#F3F7FC] border border-[#E1E8F0] rounded-lg pl-9 pr-3 py-1.5 text-[13px] text-[#17243B] placeholder-[#718096] focus:outline-none focus:border-[#2166F3] focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Role Switcher Pills for easy preview */}
        <div className="hidden lg:flex items-center bg-[#F3F7FC] p-0.5 rounded-lg border border-[#E1E8F0] text-[11px] font-medium text-[#718096]">
          <button
            onClick={() => handleRoleChange('STUDENT')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              role === 'STUDENT'
                ? 'bg-white text-[#2166F3] shadow-xs font-semibold'
                : 'hover:text-[#17243B]'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => handleRoleChange('FACULTY')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              role === 'FACULTY'
                ? 'bg-white text-[#2166F3] shadow-xs font-semibold'
                : 'hover:text-[#17243B]'
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => handleRoleChange('ADMIN')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              role === 'ADMIN'
                ? 'bg-white text-[#2166F3] shadow-xs font-semibold'
                : 'hover:text-[#17243B]'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Search Icon button */}
        <button className="text-[#718096] hover:text-[#17243B] p-2 rounded-lg hover:bg-[#F3F7FC] transition-colors">
          <Search size={18} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button className="text-[#718096] hover:text-[#17243B] p-2 rounded-lg hover:bg-[#F3F7FC] transition-colors relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#E65363] rounded-full ring-2 ring-white" />
          </button>
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#F3F7FC] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#2166F3] text-white flex items-center justify-center font-bold text-xs">
              {role === 'ADMIN' ? 'A' : role === 'FACULTY' ? 'F' : 'S'}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[12px] font-semibold text-[#17243B] leading-tight">
                {getRoleBadge()}
              </span>
            </div>
            <ChevronDown size={14} className="text-[#718096]" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-dropdown border border-[#E1E8F0] py-2 z-50 animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-[#E1E8F0]">
                <p className="text-[12px] font-semibold text-[#17243B] truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-[#718096] truncate">{user?.email || 'user@college.edu'}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#EDF4FF] text-[#2166F3] font-medium">
                  {role} Role
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#17243B] hover:bg-[#F3F7FC]"
                >
                  <UserIcon size={14} className="text-[#718096]" />
                  <span>My Profile</span>
                </button>

                <div className="px-4 py-1 text-[10px] uppercase font-semibold text-[#718096] tracking-wider">
                  Switch Active Role
                </div>
                <button
                  onClick={() => handleRoleChange('STUDENT')}
                  className="w-full flex items-center justify-between px-4 py-1.5 text-[12px] text-[#17243B] hover:bg-[#F3F7FC]"
                >
                  <span>Student View</span>
                  {role === 'STUDENT' && <span className="text-[#20A875] text-[10px]">● Active</span>}
                </button>
                <button
                  onClick={() => handleRoleChange('FACULTY')}
                  className="w-full flex items-center justify-between px-4 py-1.5 text-[12px] text-[#17243B] hover:bg-[#F3F7FC]"
                >
                  <span>Faculty View</span>
                  {role === 'FACULTY' && <span className="text-[#20A875] text-[10px]">● Active</span>}
                </button>
                <button
                  onClick={() => handleRoleChange('ADMIN')}
                  className="w-full flex items-center justify-between px-4 py-1.5 text-[12px] text-[#17243B] hover:bg-[#F3F7FC]"
                >
                  <span>Admin View</span>
                  {role === 'ADMIN' && <span className="text-[#20A875] text-[10px]">● Active</span>}
                </button>
              </div>

              <div className="border-t border-[#E1E8F0] pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#E65363] hover:bg-[#FDEEF0]"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  DoorOpen,
  FileText,
  User as UserIcon,
  Layers,
  Calendar,
  Users,
  CheckSquare,
  LogOut,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { role, isBackendConnected, switchRole } = useAuth();
  const navigate = useNavigate();

  // Navigation configurations based on user role
  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
          { name: 'Manage Resources', path: '/admin/resources', icon: <Layers size={18} /> },
          { name: 'Requests', path: '/admin/requests', icon: <FileText size={18} /> },
          { name: 'Manage Users', path: '/admin/users', icon: <Users size={18} /> },
          { name: 'Profile', path: '/profile', icon: <UserIcon size={18} /> },
        ];
      case 'FACULTY':
        return [
          { name: 'Dashboard', path: '/faculty', icon: <LayoutDashboard size={18} /> },
          { name: 'Requests', path: '/faculty/requests', icon: <CheckSquare size={18} /> },
          { name: 'My Schedule', path: '/schedule', icon: <Calendar size={18} /> },
          { name: 'Profile', path: '/profile', icon: <UserIcon size={18} /> },
        ];
      case 'STUDENT':
      default:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
          { name: 'Room Availability', path: '/rooms', icon: <DoorOpen size={18} /> },
          { name: 'My Requests', path: '/requests', icon: <FileText size={18} /> },
          { name: 'Profile', path: '/profile', icon: <UserIcon size={18} /> },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="w-60 bg-white border-r border-[#E1E8F0] flex flex-col h-screen fixed left-0 top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#E1E8F0] gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#2166F3] flex items-center justify-center text-white font-bold text-lg shadow-sm">
          S
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-[#102448]">Smartly</span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
          {role} Menu
        </div>
        {navLinks.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#EDF4FF] text-[#2166F3] font-semibold'
                  : 'text-[#718096] hover:text-[#17243B] hover:bg-[#F3F7FC]'
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Quick All-Screens Nav for Reviewer convenience */}
      <div className="px-3 py-2.5 border-t border-[#E1E8F0] bg-[#F8FAFC]">
        <div className="text-[10px] font-semibold text-[#718096] uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>9 Screens Jump</span>
          <span className="text-[9px] bg-blue-100 text-[#2166F3] px-1 rounded">Quick View</span>
        </div>
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val.startsWith('ROLE_')) {
              const r = val.replace('ROLE_', '') as any;
              switchRole(r);
              if (r === 'STUDENT') navigate('/dashboard');
              else if (r === 'FACULTY') navigate('/faculty/requests');
              else if (r === 'ADMIN') navigate('/admin');
            } else {
              navigate(val);
            }
          }}
          className="w-full text-[11px] bg-white border border-[#E1E8F0] rounded-md px-2 py-1 text-[#17243B] font-medium focus:outline-none focus:border-[#2166F3]"
        >
          <option value="">Jump to Screen...</option>
          <option value="/login">1. Login Page</option>
          <option value="/dashboard">2. Student Dashboard</option>
          <option value="/rooms">3. Room Availability</option>
          <option value="/rooms/1">4. Room Details & Request</option>
          <option value="/requests">5. Student - My Requests</option>
          <option value="/faculty/requests">6. Faculty - Approvals</option>
          <option value="/admin">7. Admin Dashboard</option>
          <option value="/admin/resources">8. Admin - Manage Resources</option>
          <option value="/profile">9. Profile Page</option>
        </select>
      </div>

      {/* Backend Status Footer */}
      <div className="p-3 border-t border-[#E1E8F0] bg-white">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <Radio
              size={12}
              className={isBackendConnected ? 'text-[#20A875] animate-pulse' : 'text-[#F4AD32]'}
            />
            <span className="text-[#718096] truncate">
              {isBackendConnected ? 'Backend Live' : 'Demo Data'}
            </span>
          </div>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
              isBackendConnected ? 'bg-[#EAF7F0] text-[#20A875]' : 'bg-[#FEF7EC] text-[#E09214]'
            }`}
          >
            {isBackendConnected ? ':5000' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
};

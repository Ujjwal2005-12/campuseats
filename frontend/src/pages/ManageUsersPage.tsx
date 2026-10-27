import React, { useState, useEffect } from 'react';
import { Users, Search, CheckCircle2, Shield } from 'lucide-react';
import { userService } from '../services/user.service';
import { User } from '../types';

export const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'System Administrator', email: 'admin@smartly.local', role: 'ADMIN', is_active: 1 },
    { id: 2, name: 'Prof. Alan Turing', email: 'faculty@smartly.local', role: 'FACULTY', is_active: 1 },
    { id: 3, name: 'Grace Hopper', email: 'student@smartly.local', role: 'STUDENT', is_active: 1 },
    { id: 4, name: 'Ada Lovelace', email: 'student2@smartly.local', role: 'STUDENT', is_active: 1 },
  ]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getAllUsers();
        if (data && data.length > 0) setUsers(data);
      } catch {}
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#17243B] tracking-tight">Manage Users</h1>
        <p className="text-[13px] text-[#718096] mt-0.5">Control institutional account privileges and roles.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E8F0] p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              roleFilter === 'ALL' ? 'bg-[#2166F3] text-white' : 'bg-[#F8FAFC] text-[#718096]'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => setRoleFilter('STUDENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              roleFilter === 'STUDENT' ? 'bg-[#2166F3] text-white' : 'bg-[#F8FAFC] text-[#718096]'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setRoleFilter('FACULTY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              roleFilter === 'FACULTY' ? 'bg-[#2166F3] text-white' : 'bg-[#F8FAFC] text-[#718096]'
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              roleFilter === 'ADMIN' ? 'bg-[#2166F3] text-white' : 'bg-[#F8FAFC] text-[#718096]'
            }`}
          >
            Admins
          </button>
        </div>

        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#17243B]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E1E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#718096] uppercase tracking-wider">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Institutional Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1E8F0] text-xs">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-[#F3F7FC]">
                <td className="py-3.5 px-4 font-semibold text-[#17243B]">{u.name}</td>
                <td className="py-3.5 px-4 text-[#718096]">{u.email}</td>
                <td className="py-3.5 px-4 font-semibold text-[#2166F3]">{u.role}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#EAF7F0] text-[#20A875] font-semibold">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

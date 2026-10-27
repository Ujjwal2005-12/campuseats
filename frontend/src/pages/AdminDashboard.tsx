import React, { useState, useEffect } from 'react';
import { DoorOpen, Building2, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { dashboardService } from '../services/dashboard.service';
import { bookingService } from '../services/booking.service';
import { Booking } from '../types';
import { DEMO_BOOKINGS } from '../services/demoData';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalRooms: 48,
    totalBuildings: 5,
    activeRequests: 23,
    occupancyRate: '65%',
    available: 27,
    occupied: 17,
    reserved: 4,
  });

  const [recentRequests, setRecentRequests] = useState<Booking[]>(DEMO_BOOKINGS.slice(0, 4));

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashData, allBookings] = await Promise.all([
          dashboardService.getStats(),
          bookingService.getAllBookings(),
        ]);

        if (dashData) {
          const facilities = dashData.facilities || {};
          const summary = dashData.summary || {};
          const bookings = dashData.bookings || {};

          const total = summary.totalFacilities || 48;
          const occ = facilities.occupied || 17;
          const avail = facilities.available || 27;
          const res = facilities.maintenance || 4;

          const rate = total > 0 ? `${Math.round((occ / total) * 100)}%` : '65%';

          setStats({
            totalRooms: total,
            totalBuildings: 5,
            activeRequests: bookings.pending || 23,
            occupancyRate: rate,
            available: avail,
            occupied: occ,
            reserved: res,
          });

          if (dashData.recentActivity && dashData.recentActivity.length > 0) {
            setRecentRequests(
              dashData.recentActivity.map((r: any, idx: number) => ({
                id: r.id,
                displayId: `REQ-2026-${String(r.id).padStart(3, '0')}`,
                user_id: r.user_id,
                user_name: r.user_name || 'Student',
                resource_id: r.resource_id,
                resource_name: r.resource_name || 'Room',
                start_time: r.start_time,
                end_time: r.end_time,
                purpose: r.purpose,
                status: r.status,
              }))
            );
          } else if (allBookings && allBookings.length > 0) {
            setRecentRequests(allBookings.slice(0, 4));
          }
        }
      } catch (err) {
        console.warn('Using default admin stats:', err);
      }
    };

    loadData();
  }, []);

  // Pie chart data
  const chartData = [
    { name: 'Available', value: stats.available, color: '#20A875' },
    { name: 'Occupied', value: stats.occupied, color: '#E65363' },
    { name: 'Reserved', value: stats.reserved, color: '#F4AD32' },
  ];

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '25 Sep 2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#17243B] tracking-tight">Administration</h1>
        <p className="text-[13px] text-[#718096] mt-0.5">Manage campus resources and access control.</p>
      </div>

      {/* 4 Stat Cards in a row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Rooms"
          value={stats.totalRooms}
          icon={<DoorOpen size={20} />}
          iconBgColor="bg-[#EDF4FF]"
          iconTextColor="text-[#2166F3]"
        />
        <StatCard
          title="Total Buildings"
          value={stats.totalBuildings}
          icon={<Building2 size={20} />}
          iconBgColor="bg-[#EAF7F0]"
          iconTextColor="text-[#20A875]"
        />
        <StatCard
          title="Active Requests"
          value={stats.activeRequests}
          icon={<Clock size={20} />}
          iconBgColor="bg-[#FDEEF0]"
          iconTextColor="text-[#E65363]"
        />
        <StatCard
          title="Occupancy Rate"
          value={stats.occupancyRate}
          icon={<PieChartIcon size={20} />}
          iconBgColor="bg-[#FEF7EC]"
          iconTextColor="text-[#F4AD32]"
        />
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Requests Table (7 of 12 cols = 58%) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E1E8F0] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E1E8F0]">
            <h2 className="text-sm font-semibold text-[#17243B]">Recent Requests</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E1E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#718096] uppercase tracking-wider">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E8F0] text-[12px] text-[#17243B]">
                {recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F3F7FC] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#17243B]">
                      {req.displayId || `REQ-2026-${String(req.id).padStart(3, '0')}`}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#17243B]">{req.user_name}</td>
                    <td className="py-3.5 px-4 font-medium text-[#2166F3]">{req.resource_name}</td>
                    <td className="py-3.5 px-4 text-[#718096]">{formatDate(req.start_time)}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Room Utilization Donut Chart (5 of 12 cols = 42%) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E1E8F0] shadow-xs p-5">
          <div className="pb-3 border-b border-[#E1E8F0] mb-4">
            <h2 className="text-sm font-semibold text-[#17243B]">Room Utilization</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            {/* Donut Chart with Centered Metric */}
            <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-[#17243B] leading-none">
                  {stats.totalRooms}
                </span>
                <span className="text-[10px] text-[#718096] font-medium mt-0.5">Total Rooms</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#20A875] flex-shrink-0" />
                <span className="text-[#718096]">Available:</span>
                <span className="font-bold text-[#17243B]">{stats.available}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#E65363] flex-shrink-0" />
                <span className="text-[#718096]">Occupied:</span>
                <span className="font-bold text-[#17243B]">{stats.occupied}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#F4AD32] flex-shrink-0" />
                <span className="text-[#718096]">Reserved:</span>
                <span className="font-bold text-[#17243B]">{stats.reserved}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

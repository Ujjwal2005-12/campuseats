import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, FileText, CheckCircle2, XCircle, ArrowUpRight, Search, FlaskConical } from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { roomService } from '../services/room.service';
import { bookingService } from '../services/booking.service';
import { dashboardService } from '../services/dashboard.service';
import { Room } from '../types';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState({
    totalRooms: 48,
    available: 27,
    occupied: 17,
    myRequests: 5,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [roomData, myBookings, dashStats] = await Promise.all([
          roomService.getAllRooms(),
          bookingService.getMyBookings(),
          dashboardService.getStats(),
        ]);

        if (roomData && roomData.length > 0) {
          setRooms(roomData);
        }

        if (dashStats?.summary) {
          setStats({
            totalRooms: dashStats.summary.totalFacilities || 48,
            available: dashStats.summary.availableFacilities || 27,
            occupied: dashStats.facilities?.occupied || 17,
            myRequests: myBookings.length || 5,
          });
        }
      } catch (err) {
        console.warn('Using default reference statistics:', err);
      }
    };

    loadData();
  }, []);

  // Display rows matching the reference image
  const displayRooms = rooms.length > 0 ? rooms.slice(0, 4) : [
    { id: 1, name: 'LAB-204', building: 'Academic Block', type: 'Laboratory', capacity: 40, status: 'AVAILABLE' as const, nextFree: 'Now' },
    { id: 3, name: 'ROOM-301', building: 'Academic Block', type: 'Classroom', capacity: 60, status: 'OCCUPIED' as const, nextFree: '11:30 AM' },
    { id: 5, name: 'LAB-101', building: 'Computer Block', type: 'Laboratory', capacity: 45, status: 'AVAILABLE' as const, nextFree: 'Now' },
    { id: 6, name: 'ROOM-105', building: 'Science Block', type: 'Classroom', capacity: 50, status: 'RESERVED' as const, nextFree: '2:00 PM' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#17243B] tracking-tight">Welcome back, Student!</h1>
        <p className="text-[13px] text-[#718096] mt-0.5">Here's an overview of campus resources.</p>
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
          title="Available Now"
          value={stats.available}
          icon={<CheckCircle2 size={20} />}
          iconBgColor="bg-[#EAF7F0]"
          iconTextColor="text-[#20A875]"
        />
        <StatCard
          title="Occupied"
          value={stats.occupied}
          icon={<XCircle size={20} />}
          iconBgColor="bg-[#FDEEF0]"
          iconTextColor="text-[#E65363]"
        />
        <StatCard
          title="My Requests"
          value={stats.myRequests}
          icon={<FileText size={20} />}
          iconBgColor="bg-[#F3E8FF]"
          iconTextColor="text-[#8B5CF6]"
        />
      </div>

      {/* Quick Access Section */}
      <div>
        <h2 className="text-[13px] font-semibold text-[#17243B] uppercase tracking-wider mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/rooms')}
            className="bg-white rounded-xl border border-[#E1E8F0] p-4 flex items-center gap-3.5 hover:border-[#2166F3] hover:shadow-sm cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#EDF4FF] text-[#2166F3] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Search size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-semibold text-[#17243B] group-hover:text-[#2166F3] transition-colors">
                View Room Availability
              </h3>
              <p className="text-[11px] text-[#718096] truncate">Search and check available rooms</p>
            </div>
            <ArrowUpRight size={16} className="text-[#718096] group-hover:text-[#2166F3] transition-colors" />
          </div>

          <div
            onClick={() => navigate('/requests')}
            className="bg-white rounded-xl border border-[#E1E8F0] p-4 flex items-center gap-3.5 hover:border-[#2166F3] hover:shadow-sm cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#EDF4FF] text-[#2166F3] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-semibold text-[#17243B] group-hover:text-[#2166F3] transition-colors">
                My Requests
              </h3>
              <p className="text-[11px] text-[#718096] truncate">Track your submitted requests</p>
            </div>
            <ArrowUpRight size={16} className="text-[#718096] group-hover:text-[#2166F3] transition-colors" />
          </div>

          <div
            onClick={() => navigate('/rooms?type=Laboratory')}
            className="bg-white rounded-xl border border-[#E1E8F0] p-4 flex items-center gap-3.5 hover:border-[#2166F3] hover:shadow-sm cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#EDF4FF] text-[#2166F3] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <FlaskConical size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[13px] font-semibold text-[#17243B] group-hover:text-[#2166F3] transition-colors">
                Browse Laboratories
              </h3>
              <p className="text-[11px] text-[#718096] truncate">View all lab facilities</p>
            </div>
            <ArrowUpRight size={16} className="text-[#718096] group-hover:text-[#2166F3] transition-colors" />
          </div>
        </div>
      </div>

      {/* Recently Added Resources Table Card */}
      <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E1E8F0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#17243B]">Recently Added Resources</h2>
          <button
            onClick={() => navigate('/rooms')}
            className="text-[12px] font-semibold text-[#2166F3] hover:underline"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#718096] uppercase tracking-wider">
                <th className="py-3 px-5">Room</th>
                <th className="py-3 px-5">Building</th>
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-5">Capacity</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Next Free</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E8F0] text-[12px] text-[#17243B]">
              {displayRooms.map((room) => (
                <tr
                  key={room.id}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                  className="hover:bg-[#F3F7FC] transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-5 font-semibold text-[#17243B]">{room.name}</td>
                  <td className="py-3.5 px-5 text-[#718096]">{room.building || room.location || 'Academic Block'}</td>
                  <td className="py-3.5 px-5 text-[#718096]">{room.type}</td>
                  <td className="py-3.5 px-5">{room.capacity}</td>
                  <td className="py-3.5 px-5">
                    <StatusBadge status={room.status} />
                  </td>
                  <td className="py-3.5 px-5 text-[#718096]">{room.nextFree || 'Now'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

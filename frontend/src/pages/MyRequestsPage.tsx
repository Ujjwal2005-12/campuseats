import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../components/common/StatusBadge';
import { bookingService } from '../services/booking.service';
import { Booking } from '../types';
import { Modal } from '../components/common/Modal';
import { DEMO_BOOKINGS } from '../services/demoData';

export const MyRequestsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS.slice(0, 5));
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getMyBookings();
      if (data && data.length > 0) {
        setBookings(data);
      }
    } catch (err) {
      console.warn('Using demo requests:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    approved: bookings.filter((b) => b.status === 'APPROVED').length,
    rejected: bookings.filter((b) => b.status === 'REJECTED').length,
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  const handleCancel = async (id: number) => {
    try {
      await bookingService.cancelBooking(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b))
      );
    } catch {
      // Demo fallback cancellation
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b))
      );
    } finally {
      setCancelModalBooking(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '25 Sep 2026';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (startStr?: string, endStr?: string) => {
    if (!startStr) return '11:00 - 12:00';
    try {
      const s = new Date(startStr);
      const e = new Date(endStr || startStr);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const sTime = s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        const eTime = e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${sTime} - ${eTime}`;
      }
    } catch {}
    return '11:00 - 12:00';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#17243B] tracking-tight">My Requests</h1>
        <p className="text-[13px] text-[#718096] mt-0.5">Track the status of your resource requests.</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ALL'
              ? 'bg-[#2166F3] text-white shadow-xs'
              : 'bg-white border border-[#E1E8F0] text-[#718096] hover:text-[#17243B]'
          }`}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'PENDING'
              ? 'bg-[#2166F3] text-white shadow-xs'
              : 'bg-white border border-[#E1E8F0] text-[#718096] hover:text-[#17243B]'
          }`}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'APPROVED'
              ? 'bg-[#2166F3] text-white shadow-xs'
              : 'bg-white border border-[#E1E8F0] text-[#718096] hover:text-[#17243B]'
          }`}
        >
          Approved ({counts.approved})
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'REJECTED'
              ? 'bg-[#2166F3] text-white shadow-xs'
              : 'bg-white border border-[#E1E8F0] text-[#718096] hover:text-[#17243B]'
          }`}
        >
          Rejected ({counts.rejected})
        </button>
      </div>

      {/* Requests Table Card */}
      <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#718096] uppercase tracking-wider">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Building</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E8F0] text-[12px] text-[#17243B]">
              {filteredBookings.map((req) => (
                <tr key={req.id} className="hover:bg-[#F3F7FC] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#17243B]">
                    {req.displayId || `REQ-2026-${String(req.id).padStart(3, '0')}`}
                  </td>
                  <td className="py-3.5 px-4 font-medium">{req.resource_name || 'LAB-204'}</td>
                  <td className="py-3.5 px-4 text-[#718096]">{req.building || req.resource_location || 'Academic Block'}</td>
                  <td className="py-3.5 px-4 text-[#718096]">{formatDate(req.start_time)}</td>
                  <td className="py-3.5 px-4 text-[#718096]">{formatTime(req.start_time, req.end_time)}</td>
                  <td className="py-3.5 px-4 text-[#17243B]">{req.purpose}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => setCancelModalBooking(req)}
                        className="text-[#2166F3] hover:text-[#1a54cc] font-medium text-[11px] hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                    {req.status === 'REJECTED' && (
                      <button
                        onClick={() => setViewBooking(req)}
                        className="text-[#2166F3] hover:text-[#1a54cc] font-medium text-[11px] hover:underline"
                      >
                        View
                      </button>
                    )}
                    {req.status === 'APPROVED' && <span className="text-[#A0AEC0]">—</span>}
                    {req.status === 'CANCELLED' && <span className="text-[#A0AEC0]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Reason Modal */}
      <Modal
        isOpen={!!viewBooking}
        onClose={() => setViewBooking(null)}
        title="Request Details & Feedback"
      >
        <div className="space-y-3 text-xs">
          <div>
            <span className="font-semibold text-[#718096]">Request ID:</span>{' '}
            <span className="font-bold text-[#17243B]">{viewBooking?.displayId}</span>
          </div>
          <div>
            <span className="font-semibold text-[#718096]">Room:</span>{' '}
            <span>{viewBooking?.resource_name} ({viewBooking?.building})</span>
          </div>
          <div>
            <span className="font-semibold text-[#718096]">Status:</span>{' '}
            <StatusBadge status={viewBooking?.status || 'REJECTED'} />
          </div>
          {viewBooking?.rejection_reason && (
            <div className="p-3 rounded-lg bg-[#FDEEF0] border border-[#F9C9CF] text-[#E65363]">
              <p className="font-semibold mb-0.5">Reason for Rejection:</p>
              <p>{viewBooking.rejection_reason}</p>
            </div>
          )}
          <div className="pt-2 text-right">
            <button
              onClick={() => setViewBooking(null)}
              className="px-4 py-1.5 rounded-lg bg-[#2166F3] text-white font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Request Modal */}
      <Modal
        isOpen={!!cancelModalBooking}
        onClose={() => setCancelModalBooking(null)}
        title="Confirm Cancellation"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#17243B]">
            Are you sure you want to cancel request <strong>{cancelModalBooking?.displayId}</strong> for <strong>{cancelModalBooking?.resource_name}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setCancelModalBooking(null)}
              className="px-3 py-1.5 rounded-lg border border-[#E1E8F0] text-[#718096] hover:bg-[#F3F7FC]"
            >
              Keep Request
            </button>
            <button
              onClick={() => cancelModalBooking && handleCancel(cancelModalBooking.id)}
              className="px-3 py-1.5 rounded-lg bg-[#E65363] text-white font-semibold hover:bg-red-600"
            >
              Confirm Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

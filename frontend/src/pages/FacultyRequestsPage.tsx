import React, { useState, useEffect } from 'react';
import { Search, Check, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { bookingService } from '../services/booking.service';
import { Booking } from '../types';
import { Modal } from '../components/common/Modal';
import { DEMO_BOOKINGS } from '../services/demoData';

export const FacultyRequestsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [rejectModalBooking, setRejectModalBooking] = useState<Booking | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Room maintenance or scheduling conflict');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getAllBookings();
      if (data && data.length > 0) {
        setBookings(data);
      }
    } catch (err) {
      console.warn('Using demo bookings for faculty:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const counts = {
    pending: bookings.filter((b) => b.status === 'PENDING').length,
    approved: bookings.filter((b) => b.status === 'APPROVED').length,
    rejected: bookings.filter((b) => b.status === 'REJECTED').length,
  };

  const handleApprove = async (id: number) => {
    try {
      await bookingService.updateStatus(id, 'APPROVED');
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'APPROVED' } : b))
      );
      setToastMessage('Request approved successfully!');
      setTimeout(() => setToastMessage(null), 2500);
    } catch {
      // Demo fallback
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'APPROVED' } : b))
      );
      setToastMessage('Request approved (demonstration mode)');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalBooking) return;
    try {
      await bookingService.updateStatus(rejectModalBooking.id, 'REJECTED', rejectionReason);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === rejectModalBooking.id
            ? { ...b, status: 'REJECTED', rejection_reason: rejectionReason }
            : b
        )
      );
      setToastMessage('Request rejected.');
      setTimeout(() => setToastMessage(null), 2500);
    } catch {
      // Demo fallback
      setBookings((prev) =>
        prev.map((b) =>
          b.id === rejectModalBooking.id
            ? { ...b, status: 'REJECTED', rejection_reason: rejectionReason }
            : b
        )
      );
      setToastMessage('Request rejected (demonstration mode)');
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setRejectModalBooking(null);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesTab = b.status === activeTab;
    const matchesSearch =
      (b.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.resource_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.purpose || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.displayId || '').toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

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
        <h1 className="text-2xl font-bold text-[#17243B] tracking-tight">Pending Requests</h1>
        <p className="text-[13px] text-[#718096] mt-0.5">Review and approve resource requests.</p>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-lg bg-[#EAF7F0] border border-[#B7E7D1] text-[#20A875] text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs & Search Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'PENDING'
                ? 'bg-[#2166F3] text-white shadow-xs'
                : 'bg-white border border-[#E1E8F0] text-[#718096] hover:text-[#17243B]'
            }`}
          >
            Pending ({counts.pending || 4})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'APPROVED'
                ? 'bg-[#2166F3] text-white shadow-xs'
                : 'bg-white border border-[#E1E8F0] text-[#718096] hover:text-[#17243B]'
            }`}
          >
            Approved ({counts.approved || 12})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'REJECTED'
                ? 'bg-[#2166F3] text-white shadow-xs'
                : 'bg-white border border-[#E1E8F0] text-[#718096] hover:text-[#17243B]'
            }`}
          >
            Rejected ({counts.rejected || 6})
          </button>
        </div>

        {/* Search input right */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student, room..."
            className="w-full bg-white border border-[#E1E8F0] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#17243B] focus:outline-none focus:border-[#2166F3]"
          />
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#718096] uppercase tracking-wider">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E8F0] text-[12px] text-[#17243B]">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-[#F3F7FC] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#17243B]">
                    {req.displayId || `REQ-2026-${String(req.id).padStart(3, '0')}`}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#17243B]">{req.user_name}</td>
                  <td className="py-3.5 px-4 font-medium text-[#2166F3]">{req.resource_name}</td>
                  <td className="py-3.5 px-4 text-[#718096]">{formatDate(req.start_time)}</td>
                  <td className="py-3.5 px-4 text-[#718096]">{formatTime(req.start_time, req.end_time)}</td>
                  <td className="py-3.5 px-4 text-[#17243B]">{req.purpose}</td>
                  <td className="py-3.5 px-4 text-center">
                    {req.status === 'PENDING' ? (
                      <div className="flex items-center justify-center gap-2">
                        {/* Green Approve Button */}
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-3 py-1 rounded-md bg-[#20A875] hover:bg-emerald-600 text-white font-medium text-[11px] transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <Check size={12} />
                          <span>Approve</span>
                        </button>
                        {/* Red Outlined Reject Button */}
                        <button
                          onClick={() => setRejectModalBooking(req)}
                          className="px-3 py-1 rounded-md border border-[#E65363] text-[#E65363] hover:bg-[#FDEEF0] font-medium text-[11px] transition-colors flex items-center gap-1"
                        >
                          <X size={12} />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <StatusBadge status={req.status} />
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#718096] text-xs">
                    No requests found matching current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectModalBooking}
        onClose={() => setRejectModalBooking(null)}
        title="Reject Resource Request"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#17243B]">
            Provide a justification for rejecting request{' '}
            <strong>{rejectModalBooking?.displayId}</strong> submitted by{' '}
            <strong>{rejectModalBooking?.user_name}</strong> for room{' '}
            <strong>{rejectModalBooking?.resource_name}</strong>.
          </p>

          <div>
            <label className="block text-[11px] font-semibold text-[#17243B] mb-1">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              required
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg p-2.5 text-xs text-[#17243B] focus:outline-none focus:border-[#2166F3]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setRejectModalBooking(null)}
              className="px-3 py-1.5 rounded-lg border border-[#E1E8F0] text-[#718096] hover:bg-[#F3F7FC]"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectConfirm}
              className="px-3 py-1.5 rounded-lg bg-[#E65363] text-white font-semibold hover:bg-red-600"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

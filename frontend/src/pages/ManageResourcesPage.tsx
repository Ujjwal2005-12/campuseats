import React, { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle2, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { roomService } from '../services/room.service';
import { Room } from '../types';
import { DEMO_ROOMS } from '../services/demoData';

export const ManageResourcesPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(DEMO_ROOMS);
  const [typeFilter, setTypeFilter] = useState('All');
  const [buildingFilter, setBuildingFilter] = useState('All Buildings');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('Academic Block');
  const [roomType, setRoomType] = useState('Laboratory');
  const [capacity, setCapacity] = useState('40');
  const [equipment, setEquipment] = useState('Computers, Projector');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'UNAVAILABLE' | 'RESERVED'>('AVAILABLE');

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      const data = await roomService.getAllRooms();
      if (data && data.length > 0) {
        setRooms(data);
      }
    } catch (err) {
      console.warn('Using demo rooms in admin:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentRoomId(null);
    setName('');
    setBuilding('Academic Block');
    setRoomType('Laboratory');
    setCapacity('40');
    setEquipment('Computers, Projector');
    setDescription('');
    setStatus('AVAILABLE');
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setModalMode('edit');
    setCurrentRoomId(room.id);
    setName(room.name);
    setBuilding(room.building || room.location || 'Academic Block');
    setRoomType(room.type || 'Laboratory');
    setCapacity(String(room.capacity || 40));
    setEquipment(room.equipment ? room.equipment.join(', ') : 'Computers, Projector');
    setDescription(room.description || '');
    setStatus(room.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await roomService.deleteRoom(id);
      setRooms((prev) => prev.filter((r) => r.id !== id));
      setToastMessage('Resource deleted successfully.');
    } catch {
      // Demo fallback
      setRooms((prev) => prev.filter((r) => r.id !== id));
      setToastMessage('Resource deleted (demonstration mode).');
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      location: building,
      type: roomType,
      capacity: parseInt(capacity, 10) || 1,
      description,
      status: status === 'RESERVED' ? 'OCCUPIED' : status,
    };

    try {
      if (modalMode === 'create') {
        const created = await roomService.createRoom(payload);
        const newRoom: Room = {
          id: created?.room?.id || Date.now(),
          name,
          building,
          type: roomType,
          capacity: parseInt(capacity, 10),
          location: building,
          description,
          equipment: equipment.split(',').map((s) => s.trim()),
          status,
          nextFree: 'Now',
        };
        setRooms((prev) => [newRoom, ...prev]);
        setToastMessage('Resource created successfully!');
      } else if (currentRoomId) {
        await roomService.updateRoom(currentRoomId, payload);
        setRooms((prev) =>
          prev.map((r) =>
            r.id === currentRoomId
              ? {
                  ...r,
                  name,
                  building,
                  location: building,
                  type: roomType,
                  capacity: parseInt(capacity, 10),
                  description,
                  equipment: equipment.split(',').map((s) => s.trim()),
                  status,
                }
              : r
          )
        );
        setToastMessage('Resource updated successfully!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      // Demo fallback
      if (modalMode === 'create') {
        const newRoom: Room = {
          id: Date.now(),
          name,
          building,
          type: roomType,
          capacity: parseInt(capacity, 10),
          location: building,
          description,
          equipment: equipment.split(',').map((s) => s.trim()),
          status,
          nextFree: 'Now',
        };
        setRooms((prev) => [newRoom, ...prev]);
      } else if (currentRoomId) {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === currentRoomId
              ? {
                  ...r,
                  name,
                  building,
                  location: building,
                  type: roomType,
                  capacity: parseInt(capacity, 10),
                  description,
                  equipment: equipment.split(',').map((s) => s.trim()),
                  status,
                }
              : r
          )
        );
      }
      setToastMessage('Resource saved (demonstration mode).');
      setIsModalOpen(false);
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const filtered = rooms.filter((r) => {
    const matchesType = typeFilter === 'All' || r.type?.toLowerCase() === typeFilter.toLowerCase();
    const matchesBuilding = buildingFilter === 'All Buildings' || (r.building || r.location)?.includes(buildingFilter);
    const matchesStatus = statusFilter === 'All' || r.status?.toUpperCase() === statusFilter.toUpperCase();
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesBuilding && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with Add Resource button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17243B] tracking-tight">Manage Resources</h1>
          <p className="text-[13px] text-[#718096] mt-0.5">
            Add, update and manage classrooms, laboratories and equipment.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#2166F3] hover:bg-[#1a54cc] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus size={16} />
          <span>Add Resource</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-lg bg-[#EAF7F0] border border-[#B7E7D1] text-[#20A875] text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#E1E8F0] p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          {/* Room Type */}
          <div>
            <label className="block text-[11px] font-semibold text-[#718096] mb-1">Room Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-2.5 py-1.5 text-[12px] text-[#17243B] focus:outline-none focus:border-[#2166F3]"
            >
              <option>All</option>
              <option>Laboratory</option>
              <option>Classroom</option>
              <option>Hall</option>
            </select>
          </div>

          {/* Building */}
          <div>
            <label className="block text-[11px] font-semibold text-[#718096] mb-1">Building</label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-2.5 py-1.5 text-[12px] text-[#17243B] focus:outline-none focus:border-[#2166F3]"
            >
              <option>All Buildings</option>
              <option>Academic Block</option>
              <option>Science Block</option>
              <option>Computer Block</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-[#718096] mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-2.5 py-1.5 text-[12px] text-[#17243B] focus:outline-none focus:border-[#2166F3]"
            >
              <option>All</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-[#17243B] focus:outline-none focus:border-[#2166F3]"
            />
          </div>
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-xl border border-[#E1E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E1E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#718096] uppercase tracking-wider">
                <th className="py-3 px-4">Room Number</th>
                <th className="py-3 px-4">Building</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E8F0] text-[12px] text-[#17243B]">
              {filtered.map((room) => (
                <tr key={room.id} className="hover:bg-[#F3F7FC] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#17243B]">{room.name}</td>
                  <td className="py-3.5 px-4 text-[#718096]">{room.building || room.location || 'Academic Block'}</td>
                  <td className="py-3.5 px-4 text-[#718096]">{room.type}</td>
                  <td className="py-3.5 px-4 font-medium">{room.capacity}</td>
                  <td className="py-3.5 px-4 text-[#718096]">
                    {room.equipment ? room.equipment.join(', ') : 'Computers, Projector'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={room.status} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => openEditModal(room)}
                        className="text-[#2166F3] hover:text-[#1a54cc] font-medium text-[11px] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="text-[#E65363] hover:text-red-700 font-medium text-[11px] hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#718096] text-xs">
                    No resources match current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Resource Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add Resource' : 'Edit Resource'}
      >
        <form onSubmit={handleModalSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#17243B] mb-1">Room Number</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. LAB-204, ROOM-301"
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-3 py-1.5 text-xs text-[#17243B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#17243B] mb-1">Building</label>
              <select
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#17243B]"
              >
                <option>Academic Block</option>
                <option>Science Block</option>
                <option>Computer Block</option>
                <option>Central Block</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#17243B] mb-1">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#17243B]"
              >
                <option>Laboratory</option>
                <option>Classroom</option>
                <option>Hall</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#17243B] mb-1">Capacity</label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
                min={1}
                className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-3 py-1.5 text-xs text-[#17243B]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#17243B] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#17243B]"
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#17243B] mb-1">Equipment</label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="e.g. Computers, Projector, Wi-Fi"
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-3 py-1.5 text-xs text-[#17243B]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#17243B] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Facility details..."
              className="w-full bg-[#F8FAFC] border border-[#E1E8F0] rounded-lg px-3 py-1.5 text-xs text-[#17243B]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-[#E1E8F0] text-[#718096] hover:bg-[#F3F7FC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-[#2166F3] hover:bg-[#1a54cc] text-white font-semibold"
            >
              {loading ? 'Saving...' : modalMode === 'create' ? 'Add Resource' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

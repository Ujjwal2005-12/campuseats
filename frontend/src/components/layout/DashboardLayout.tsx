import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F3F7FC] flex">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-60 flex flex-col min-w-0 min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 max-w-[1536px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

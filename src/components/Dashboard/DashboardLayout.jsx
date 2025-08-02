import React from 'react';
import { Outlet } from 'react-router-dom';
import RequireAuth from '@/components/RequireAuth';
import DashboardBottomNav from '@/components/Dashboard/DashboardBottomNav';

const DashboardLayout = () => {
  return (
    <RequireAuth>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 font-poppins overflow-x-hidden">
        <div className="flex-grow p-4 sm:p-6 lg:p-8 pb-24 md:pb-6">
          <Outlet />
        </div>

        {/* Bottom navigation for mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <DashboardBottomNav />
        </div>
      </div>
    </RequireAuth>
  );
};

export default DashboardLayout;

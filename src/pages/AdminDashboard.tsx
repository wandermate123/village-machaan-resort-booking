import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import DashboardOverview from '../components/admin/DashboardOverview';
import BookingManagement from '../components/admin/BookingManagement';
import VillaManagement from '../components/admin/VillaManagement';
import PackageManagement from '../components/admin/PackageManagement';
import UserManagement from '../components/admin/UserManagement';
import RevenueReports from '../components/admin/RevenueReports';
import RoomWiseOccupancy from '../components/admin/RoomWiseOccupancy';
import SafariQueriesManagement from '../components/admin/SafariQueriesManagement';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-primary-50">
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-cream p-6">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/bookings" element={<BookingManagement />} />
            <Route path="/occupancy" element={<RoomWiseOccupancy />} />
            <Route path="/safari-queries" element={<SafariQueriesManagement />} />
            <Route path="/villas" element={<VillaManagement />} />
            <Route path="/packages" element={<PackageManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/reports" element={<RevenueReports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
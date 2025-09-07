import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BookingProvider } from './contexts/BookingContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastContainer, useToast } from './components/common/Toast';
import BookingFlow from './components/booking/BookingFlow';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';

function App() {
  const { toasts, removeToast } = useToast();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BookingProvider>
          <Router>
            <Routes>
              <Route path="/" element={<BookingFlow />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </Router>
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </BookingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
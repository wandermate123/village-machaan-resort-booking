import React from 'react';
import { Wrench, Clock, Phone, Mail } from 'lucide-react';

const MaintenanceMode = () => {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center">
            <Wrench className="w-8 h-8 text-warning-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-serif font-bold text-primary-950 mb-4">
          Under Maintenance
        </h1>
        
        <p className="text-primary-700 mb-6 leading-relaxed">
          We're currently performing scheduled maintenance to improve your experience. 
          We'll be back shortly!
        </p>

        <div className="bg-primary-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 text-primary-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Expected completion: 30 minutes</span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-center space-x-2 text-primary-600">
            <Phone className="w-4 h-4" />
            <span>Emergency bookings: +91 7462 252052</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-primary-600">
            <Mail className="w-4 h-4" />
            <span>Email: villagemachaan@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
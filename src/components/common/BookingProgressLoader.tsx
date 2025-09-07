import React from 'react';
import { CheckCircle, Clock, CreditCard, Mail, Database } from 'lucide-react';

interface BookingProgressLoaderProps {
  currentStep: 'processing' | 'updating' | 'emailing' | 'completing';
  message?: string;
}

const BookingProgressLoader: React.FC<BookingProgressLoaderProps> = ({ 
  currentStep, 
  message 
}) => {
  const steps = [
    { id: 'processing', label: 'Processing Payment', icon: CreditCard, completed: false },
    { id: 'updating', label: 'Updating Booking', icon: Database, completed: false },
    { id: 'emailing', label: 'Sending Confirmation', icon: Mail, completed: false },
    { id: 'completing', label: 'Finalizing', icon: CheckCircle, completed: false }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-primary-100 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-primary-950 mb-2">
          Processing Your Booking
        </h3>
        <p className="text-primary-700 text-sm">
          {message || 'Please wait while we process your booking...'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div key={step.id} className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-100 text-green-600' 
                  : isCurrent 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex-1">
                <p className={`text-sm font-medium transition-colors duration-300 ${
                  isCompleted 
                    ? 'text-green-700' 
                    : isCurrent 
                      ? 'text-blue-700' 
                      : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                    <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Animated dots */}
      <div className="text-center mt-6">
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default BookingProgressLoader;

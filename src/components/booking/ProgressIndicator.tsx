import React from 'react';
import { Check, Calendar, Package, Camera, CreditCard } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, title: 'Date & Villa', icon: Calendar },
    { number: 2, title: 'Package', icon: Package },
    { number: 3, title: 'Safari', icon: Camera },
    { number: 4, title: 'Summary', icon: CreditCard },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-6 left-0 w-full h-1 bg-primary-200 rounded-full">
          <div 
            className="h-full bg-secondary-600 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const IconComponent = step.icon;

          return (
            <div key={step.number} className="flex flex-col items-center relative z-10">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300
                ${isCompleted 
                  ? 'bg-success-500 border-success-500 text-white' 
                  : isCurrent 
                    ? 'bg-secondary-600 border-secondary-600 text-white shadow-lg transform scale-110' 
                    : 'bg-white border-primary-300 text-primary-600'
                }
              `}>
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <IconComponent className="w-5 h-5" />
                )}
              </div>
              <div className="mt-3 text-center">
                <p className={`text-sm font-medium ${
                  isCurrent ? 'text-secondary-600' : 'text-primary-700'
                }`}>
                  Step {step.number}
                </p>
                <p className={`text-xs ${
                  isCurrent ? 'text-secondary-600 font-semibold' : 'text-primary-600'
                }`}>
                  {step.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
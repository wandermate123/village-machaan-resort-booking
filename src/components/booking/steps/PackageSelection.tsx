import React from 'react';
import { useBooking } from '../../../contexts/BookingContext';
import { ChevronLeft, ChevronRight, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PackageService } from '../../../services/packageService';
import LoadingSpinner from '../../common/LoadingSpinner';

const PackageSelection = () => {
  const { state, dispatch } = useBooking();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const packagesData = await PackageService.getActivePackages();
      
      // Add demo images and highlights for display
      const packagesWithDisplay = packagesData.map((pkg, index) => ({
        ...pkg,
        image: (pkg.images && pkg.images.length > 0) ? pkg.images[0] : (pkg.id === 'basic-stay' ? '/images/glass-cottage/main.jpg' : '/images/hornbill/main.jpg'),
        highlights: pkg.inclusions || []
      }));
      
      setPackages(packagesWithDisplay);
    } catch (error) {
      console.error('Failed to load packages:', error);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg: any) => {
    dispatch({ type: 'SET_PACKAGE', payload: pkg });
  };

  const handleNext = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_STEP', payload: 1 });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F3EEE7' }}>
      {/* Header - Exact Vue.js Design */}
      <div 
        className="mx-auto"
        style={{
          width: '1280px',
          height: '54px',
          backgroundColor: '#f3eee7'
        }}
      >
        <div className="flex items-center justify-between h-full px-6">
          <h1 className="text-2xl font-light text-gray-800">Village Machaan</h1>
          <div className="flex items-center space-x-4">
            <select className="text-sm border-none bg-transparent">
              <option>English</option>
            </select>
            <select className="text-sm border-none bg-transparent">
              <option>US Dollar</option>
            </select>
            <button className="p-2">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Border Line */}
      <div 
        className="mx-auto"
        style={{
          width: '1280px',
          height: '1px',
          backgroundColor: '#000000'
        }}
      />

      {/* Progress Steps */}
      <div className="border-b border-gray-200 px-6 py-8" style={{ backgroundColor: '#F3EEE7' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl text-gray-800 mb-8">Select your Package</h2>
          
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, label: 'Date & Accommodation Selection', active: false, completed: true },
              { step: 2, label: 'Package Selection', active: true, completed: false },
              { step: 3, label: 'Safari Selection', active: false, completed: false },
              { step: 4, label: 'Confirmation', active: false, completed: false }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${
                     item.completed ? 'border-black bg-white text-black' :
                     item.active ? 'border-black bg-white text-black' : 'border-gray-300 bg-white text-gray-400'
                   }`}>
                    {item.completed ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      item.step
                    )}
                  </div>
                  <span className="text-xs text-gray-600 mt-2 text-center max-w-32 font-serif leading-tight whitespace-nowrap">{item.label}</span>
                </div>
                {index < 3 && <div className="w-16 h-px bg-gray-300 mx-4 mt-[-20px]"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Modal - Exact Vue.js Design */}
      <div className="flex justify-center py-4">
        <div 
          className="relative"
          style={{
            width: '618px',
            height: '48px'
          }}
        >
          {/* Date Summary Section */}
          <div 
            className="absolute"
            style={{
              width: '568px',
              height: '48px',
              top: '0',
              left: '50%',
              backgroundColor: '#ffffff',
              border: '0.2px solid #8b8881',
              transform: 'translate(-45.6%, 0)',
              zIndex: 5
            }}
          >
            {/* Night Count Text */}
            <div 
              className="absolute flex items-center justify-center"
              style={{
                width: '120px',
                height: '19px',
                top: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#403b34',
                fontFamily: 'TAN - Angleton, sans-serif',
                fontSize: '12px',
                fontWeight: '400',
                lineHeight: '19px',
                whiteSpace: 'nowrap',
                zIndex: 8
              }}
            >
              {state.checkIn && state.checkOut ? 
                `${Math.ceil((new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime()) / (1000 * 60 * 60 * 24))} Night${Math.ceil((new Date(state.checkOut).getTime() - new Date(state.checkIn).getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}` : 
                'Select Dates'
              }
            </div>
            
            {/* Date Details */}
            <div 
              className="absolute flex items-center justify-center"
              style={{
                width: '520px',
                height: '11px',
                top: '28px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#4f4f4f',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '10px',
                fontWeight: '400',
                lineHeight: '11px',
                whiteSpace: 'nowrap',
                zIndex: 7
              }}
            >
              {state.checkIn && state.checkOut ? 
                `Arrival : ${new Date(state.checkIn).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })} | Departure: ${new Date(state.checkOut).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}` : 
                'Please select your arrival and departure dates'
              }
            </div>
          </div>
          
          {/* Edit Button Section */}
          <div 
            className="absolute cursor-pointer"
            style={{
              width: '50px',
              height: '48px',
              top: '0',
              left: '0',
              backgroundColor: '#f9f7f3',
              border: '0.2px solid #8b8880',
              zIndex: 1
            }}
            onClick={handleBack}
          >
            {/* Arrow Icon */}
            <div 
              className="absolute"
              style={{
                width: '15px',
                height: '15px',
                top: '14px',
                left: '18px',
                background: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCAxNSAxNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOS4zNzUgMTEuMjVMNC4xMjUgNkw5LjM3NSAwLjc1TDEwLjEyNSAxLjUyNUw1LjYyNSA2TDEwLjEyNSAxMC40NzVMOS4zNzUgMTEuMjVaIiBmaWxsPSIjNEY0RjRGIi8+PC9zdmc+) no-repeat center',
                backgroundSize: 'cover',
                zIndex: 2
              }}
            />
            
            {/* Edit Text */}
            <div 
              className="absolute flex items-center justify-center"
              style={{
                width: '37px',
                height: '11px',
                top: '29px',
                left: '7px',
                color: '#4f4f4f',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '10px',
                fontWeight: '600',
                lineHeight: '11px',
                whiteSpace: 'nowrap',
                zIndex: 3
              }}
            >
              Edit
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light text-gray-800 mb-2">Our Packages</h2>
        </div>

        {/* Packages List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No packages available at the moment.</p>
          </div>
        ) : (
        <div className="space-y-8">
          {packages.map((pkg, index) => {
            const isSelected = state.selectedPackage?.id === pkg.id;
            
            return (
              <div key={pkg.id} className="bg-white border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Package Image */}
                  <div className="relative">
                    <img 
                      src={(pkg.images && pkg.images.length > 0) ? pkg.images[0] : '/images/glass-cottage/main.jpg'}
                      alt={pkg.name}
                      className="w-full h-80 lg:h-96 object-cover"
                    />
                    <button className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Package Details */}
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-light text-gray-800 mb-3">{pkg.name}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">{pkg.description}</p>
                        <p className="text-sm text-gray-500 mb-6">Duration: {pkg.duration}</p>
                      </div>
                      <div className="text-right ml-8">
                        <div className="text-sm text-gray-600 mb-1">
                          {pkg.price === 0 ? 'Base Villa Price' : `+₹${pkg.price.toLocaleString()} per night`}
                        </div>
                        <div className="text-2xl font-light text-gray-800 mb-1">
                          {pkg.price === 0 ? 'No Extra Cost' : `Extra ${pkg.duration}`}
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          {pkg.price === 0 ? 'Villa rate only' : 'Added to villa rate'}
                        </div>
                        <button 
                          onClick={() => handlePackageSelect(pkg)}
                          className={`px-6 py-2 text-sm font-medium transition-colors ${
                            isSelected 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select Now'}
                        </button>
                      </div>
                    </div>

                    {/* Package Highlights */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-3">Package Highlights:</h4>
                      <ul className="space-y-2">
                        {pkg.highlights.map((highlight, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        {pkg.price === 0 
                          ? 'Basic accommodation without meals - explore local dining options'
                          : 'Breakfast included with your villa stay - perfect way to start your day'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-12 pt-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-600 hover:text-gray-800 hover:border-gray-400 transition-colors rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Date Selection</span>
          </button>
          
          <button
            onClick={handleNext}
            className={`flex items-center space-x-2 px-8 py-3 text-sm font-medium transition-colors rounded ${
              state.selectedPackage
                ? 'bg-black text-white hover:bg-gray-800'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            <span>{state.selectedPackage ? 'Continue to Safari Selection' : 'Skip to Safari Selection'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="text-center mt-12 text-sm text-gray-600">
          <div>91-7462-252052</div>
          <div>villagemachaan@gmail.com</div>
        </div>
      </div>
    </div>
  );
};

export default PackageSelection;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-light text-gray-800">Machaan</h1>
          <div className="flex items-center space-x-4">
            <select className="text-sm border-none bg-transparent text-gray-600">
              <option>English</option>
            </select>
            <select className="text-sm border-none bg-transparent text-gray-600">
              <option>US Dollar</option>
            </select>
            <button className="p-2">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl text-gray-800 mb-8">Select your Package</h2>
          
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, label: 'Date & Accommodation Selection', active: false },
              { step: 2, label: 'Package Selection', active: true },
              { step: 3, label: 'Safari Selection', active: false },
              { step: 4, label: 'Confirmation', active: false }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${
                    item.active ? 'border-black bg-black text-white' : 'border-gray-300 text-gray-400'
                  }`}>
                    {item.step}
                  </div>
                  <span className="text-xs text-gray-600 mt-2 text-center max-w-24">{item.label}</span>
                </div>
                {index < 3 && <div className="w-16 h-px bg-gray-300 mx-4 mt-[-20px]"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Summary Bar */}
      <div className="bg-blue-500 text-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <span>You have selected accommodation for 2 adults from 01 October to 25 December</span>
          <div className="flex items-center space-x-4">
            <span>Your Night</span>
            <span>Accommodation: ₹7,500 / night</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light text-gray-800 mb-2">Our Packages</h2>
          <p className="text-gray-600">Choose from our curated experiences</p>
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
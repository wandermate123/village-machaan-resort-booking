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

  // Calculate number of nights
  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  // Calculate total package price based on duration
  const calculatePackageTotal = (pkg: any) => {
    if (!pkg || pkg.price === 0 || pkg.price === undefined || pkg.price === null) return 0;
    
    const nights = calculateNights(state.checkIn, state.checkOut);
    const guests = state.guests || 0;
    const price = Number(pkg.price) || 0;
    
    if (isNaN(price)) return 0;
    
    switch (pkg.duration) {
      case 'Per night':
        return price * nights;
      case 'Per stay':
        return price;
      case 'Per person':
        return price * guests;
      case 'One-time':
        return price;
      default:
        return price * nights; // Default to per night
    }
  };

  // Calculate dynamic villa pricing based on guest count
  const calculateVillaTotal = () => {
    const nights = calculateNights(state.checkIn, state.checkOut);
    const baseVillaPrice = state.selectedVilla?.base_price || 0;
    const guests = state.guests || 0;
    
    if (baseVillaPrice === 0 || nights === 0) return 0;
    
    // Base price is for 2 people
    const baseTotal = baseVillaPrice * nights;
    
    // Additional guests beyond 2 people
    const extraGuests = Math.max(0, guests - 2);
    const extraGuestCharge = 2000; // ₹2000 per extra person per night
    const extraGuestTotal = extraGuests * extraGuestCharge * nights;
    
    return baseTotal + extraGuestTotal;
  };

  // Calculate dynamic package pricing based on guest count
  const calculatePackageTotalWithGuests = (pkg: any) => {
    const basePackageTotal = calculatePackageTotal(pkg);
    const guests = state.guests || 0;
    const nights = calculateNights(state.checkIn, state.checkOut);
    
    if (basePackageTotal === 0) return 0;
    
    // Additional guests beyond 2 people for packages (breakfast)
    const extraGuests = Math.max(0, guests - 2);
    const extraGuestCharge = 500; // ₹500 per extra person per night for breakfast
    const extraGuestTotal = extraGuests * extraGuestCharge * nights;
    
    return basePackageTotal + extraGuestTotal;
  };

  // Calculate final total price including villa and package
  const calculateFinalTotal = (pkg: any) => {
    // Debug logging for state
    console.log('Package Selection State:', {
      checkIn: state.checkIn,
      checkOut: state.checkOut,
      selectedVilla: state.selectedVilla,
      guests: state.guests
    });
    
    const villaTotal = calculateVillaTotal();
    const packageTotal = calculatePackageTotalWithGuests(pkg);
    
    // Debug logging
    if (isNaN(villaTotal) || isNaN(packageTotal)) {
      console.log('NaN detected:', {
        villaTotal,
        packageTotal,
        pkg: pkg?.name,
        pkgPrice: pkg?.price,
        guests: state.guests,
        selectedVilla: state.selectedVilla
      });
    }
    
    // Ensure all values are numbers
    const finalTotal = (villaTotal || 0) + (packageTotal || 0);
    return isNaN(finalTotal) ? 0 : finalTotal;
  };

  useEffect(() => {
    fetchPackages();
  }, [state.selectedVilla]); // Re-load packages when villa selection changes

  const fetchPackages = async () => {
    setLoading(true);
    try {
      // Pass the selected villa to get dynamic images
      const packagesData = await PackageService.getActivePackages(state.selectedVilla);
      
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
          <img 
            src="/images/village-machaan-logo.png" 
            alt="Village Machaan" 
            className="h-16 w-auto mt-1"
          />
          <div className="flex items-center space-x-4">
            <select className="text-sm border-none bg-transparent" style={{ color: '#3F3E3E', accentColor: '#3F3E3E' }}>
              <option>English</option>
            </select>
            <select className="text-sm border-none bg-transparent" style={{ color: '#3F3E3E', accentColor: '#3F3E3E' }}>
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
          <h2 className="text-center text-gray-800 mb-8" style={{ fontSize: '18px', fontWeight: '400' }}>Select your Package</h2>
          
          <div className="flex items-center justify-center space-x-8 relative">
            {[
              { step: 1, label: 'Dates & Accommodation', active: false, completed: true },
              { step: 2, label: 'Package Selection', active: true, completed: false },
              { step: 3, label: 'Safari Selection', active: false, completed: false },
              { step: 4, label: 'Confirmation', active: false, completed: false }
            ].map((item, index) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                   item.completed ? 'border-black bg-white text-black' :
                   item.active ? 'border-black bg-white text-black' : 'border-gray-300 bg-white text-gray-400'
                 }`}>
                  {item.completed ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-base font-medium" style={{ fontSize: '16px' }}>{item.step}</span>
                  )}
                </div>
                <span 
                  className="text-xs text-gray-600 mt-2 text-center font-serif leading-tight"
                  style={{ 
                    whiteSpace: 'nowrap',
                    width: '120px'
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
            {/* Connecting Lines */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-gray-300 -z-10"></div>
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
            const packageTotal = calculatePackageTotal(pkg);
            const packageTotalWithGuests = calculatePackageTotalWithGuests(pkg);
            const villaTotal = calculateVillaTotal();
            const finalTotal = calculateFinalTotal(pkg);
            const nights = calculateNights(state.checkIn, state.checkOut);
            const guests = state.guests || 0;
            const extraGuests = Math.max(0, guests - 2);
            
            return (
              <div key={pkg.id} className="bg-white border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Package Image */}
                  <div className="relative">
                    <img 
                      src={pkg.image || '/images/glass-cottage/main.jpg'}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                      style={{ minHeight: '400px' }}
                    />
                    {/* Dynamic Image Indicator */}
                    {state.selectedVilla && (
                      <div className="absolute top-4 left-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                        📸 {state.selectedVilla.name} Images
                      </div>
                    )}
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
                          {pkg.price === 0 ? 'Villa + Package' : 
                           pkg.duration === 'Per night' ? `Villa + ₹${pkg.price.toLocaleString()}/night` :
                           pkg.duration === 'Per stay' ? 'Villa + One-time fee' :
                           pkg.duration === 'Per person' ? `Villa + ₹${pkg.price.toLocaleString()}/person` :
                           'Villa + One-time fee'}
                        </div>
                        <div className="text-3xl font-light text-gray-800 mb-1">
                          {!state.checkIn || !state.checkOut ? 'Select dates first' :
                           !state.selectedVilla ? 'Select villa first' :
                           finalTotal > 0 ? `₹${finalTotal.toLocaleString()}` : 'Calculating...'}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {!state.checkIn || !state.checkOut ? 'Please select dates' :
                           !state.selectedVilla ? 'Please select a villa' :
                           pkg.price === 0 ? 'Villa rate only' : 
                           `Total for ${nights} night${nights !== 1 ? 's' : ''} (${guests} guest${guests !== 1 ? 's' : ''})`}
                        </div>
                        {finalTotal > 0 && state.selectedVilla && (
                          <div className="text-xs text-gray-500 mb-4 space-y-1">
                            <div>Villa: ₹{villaTotal.toLocaleString()}</div>
                            {pkg.price > 0 && (
                              <div>Package: ₹{packageTotalWithGuests.toLocaleString()}</div>
                            )}
                            {extraGuests > 0 && (
                              <div className="text-orange-600">
                                +₹{(extraGuests * 2000 * nights).toLocaleString()} extra guests (room)
                                {pkg.price > 0 && ` + ₹${(extraGuests * 500 * nights).toLocaleString()} (breakfast)`}
                              </div>
                            )}
                          </div>
                        )}
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
                          : pkg.duration === 'Per night' 
                            ? `Breakfast included for all ${nights} night${nights !== 1 ? 's' : ''} of your stay`
                            : pkg.duration === 'Per person'
                              ? `Breakfast included for all ${state.guests} person${state.guests !== 1 ? 's' : ''} during your stay`
                              : 'Breakfast included with your villa stay - perfect way to start your day'
                        }
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Final price includes villa accommodation + package benefits
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
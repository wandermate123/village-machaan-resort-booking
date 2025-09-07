import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Users, MapPin, Star, Wifi, Car, Coffee } from 'lucide-react';
import ImageDebugger from '../common/ImageDebugger';

interface Villa {
  id: string;
  name: string;
  description: string;
  base_price: number;
  max_guests: number;
  amenities: string[];
  images: string[];
  status: string;
}

interface VillaSlideshowProps {
  villas: Villa[];
  onVillaSelect: (villaId: string) => void;
  selectedVillaId: string;
}

const VillaSlideshow: React.FC<VillaSlideshowProps> = ({ villas, onVillaSelect, selectedVillaId }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || villas.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % villas.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, villas.length]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % villas.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + villas.length) % villas.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) return <Wifi className="w-4 h-4" />;
    if (amenityLower.includes('parking') || amenityLower.includes('car')) return <Car className="w-4 h-4" />;
    if (amenityLower.includes('breakfast') || amenityLower.includes('coffee')) return <Coffee className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
  };

  if (villas.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">No villas available</p>
      </div>
    );
  }

  const currentVilla = villas[currentSlide];

  return (
    <div className="relative h-[600px] overflow-hidden">
      {/* Main Slide */}
      <div className="relative h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Villa Image */}
          <div className="relative overflow-hidden">
            <ImageDebugger
              imagePath={currentVilla.images?.[0] || '/images/glass-cottage/main.jpg'}
              alt={currentVilla.name}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            
            {/* Image Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            
            {/* Price Badge */}
            <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
              <div className="text-center">
                <div className="text-sm text-gray-600">From</div>
                <div className="text-2xl font-bold text-primary-950">₹{currentVilla.base_price.toLocaleString()}</div>
                <div className="text-sm text-gray-600">per night</div>
              </div>
            </div>
          </div>

          {/* Villa Details */}
          <div className="p-8 lg:p-12 flex flex-col justify-center bg-white">
            <div className="max-w-lg">
              <h3 className="text-4xl font-light text-gray-800 mb-4">{currentVilla.name}</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">{currentVilla.description}</p>
              
              {/* Villa Stats */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="flex items-center text-gray-700">
                  <Users className="w-5 h-5 mr-2 text-secondary-600" />
                  <span className="font-medium">Up to {currentVilla.max_guests} guests</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <MapPin className="w-5 h-5 mr-2 text-secondary-600" />
                  <span className="font-medium">Forest location</span>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-800 mb-4">Key Amenities</h4>
                <div className="grid grid-cols-2 gap-3">
                  {currentVilla.amenities?.slice(0, 6).map((amenity, index) => (
                    <div key={index} className="flex items-center text-gray-600">
                      {getAmenityIcon(amenity)}
                      <span className="ml-2 text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Select Button */}
              <button
                onClick={() => onVillaSelect(currentVilla.id)}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${
                  selectedVillaId === currentVilla.id
                    ? 'bg-secondary-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-800 text-white hover:bg-gray-900 hover:shadow-lg hover:transform hover:scale-105'
                }`}
              >
                {selectedVillaId === currentVilla.id ? 'Selected ✓' : 'Select This Villa'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
        onMouseEnter={() => setIsAutoPlaying(false)}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-10"
        onMouseEnter={() => setIsAutoPlaying(false)}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
        {villas.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white shadow-lg scale-125'
                : 'bg-white/60 hover:bg-white/80'
            }`}
            onMouseEnter={() => setIsAutoPlaying(false)}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      {isAutoPlaying && (
        <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-600 z-10">
          Auto-playing
        </div>
      )}

      {/* Villa Counter */}
      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-gray-700 z-10">
        {currentSlide + 1} of {villas.length}
      </div>
    </div>
  );
};

export default VillaSlideshow;
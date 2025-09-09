import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, Star, Award, Wifi } from 'lucide-react';
import ImageDebugger from '../components/common/ImageDebugger';

const HomePage = () => {
  const features = [
    {
      icon: <MapPin className="w-8 h-8 text-secondary-600" />,
      title: "Prime Location",
      description: "Nestled in the heart of nature with breathtaking views"
    },
    {
      icon: <Star className="w-8 h-8 text-secondary-600" />,
      title: "Luxury Amenities",
      description: "World-class facilities and personalized service"
    },
    {
      icon: <Award className="w-8 h-8 text-secondary-600" />,
      title: "Award Winning",
      description: "Recognized for excellence in hospitality"
    },
    {
      icon: <Wifi className="w-8 h-8 text-secondary-600" />,
      title: "Modern Comfort",
      description: "All modern amenities in a natural setting"
    }
  ];


  return (
    <div className="bg-cream" style={{ backgroundColor: '#F3EEE7' }}>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-b from-primary-900/20 to-primary-900/40" 
               style={{
                 backgroundImage: 'url(/images/glass-cottage/main.jpg)',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
        <div className="absolute inset-0 bg-primary-950/40"></div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 animate-fade-in">
            Village Machaan
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 leading-relaxed">
            Experience luxury in harmony with nature. Book your perfect retreat today.
          </p>
          <Link 
            to="/booking"
            className="inline-flex items-center gap-3 bg-secondary-600 hover:bg-secondary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Calendar className="w-6 h-6" />
            Book Your Stay
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-serif font-bold text-center text-primary-950 mb-16">
            Why Choose Village Machaan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-primary-950 mb-4">{feature.title}</h3>
                <p className="text-primary-700 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary-950 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif font-bold mb-6">Ready for Your Perfect Getaway?</h2>
          <p className="text-xl mb-8 opacity-90">
            Experience the magic of Village Machaan with our curated packages and exceptional hospitality.
          </p>
          <Link 
            to="/booking"
            className="inline-flex items-center gap-3 bg-secondary-600 hover:bg-secondary-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            <Calendar className="w-6 h-6" />
            Start Booking
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
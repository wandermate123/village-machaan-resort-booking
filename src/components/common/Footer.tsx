import React from 'react';
import { TreePine, Phone, Mail, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <TreePine className="w-8 h-8 text-secondary-600" />
              <span className="text-2xl font-serif font-bold">Village Machaan</span>
            </div>
            <p className="text-primary-200 leading-relaxed mb-6">
              Experience the perfect blend of luxury and nature at Village Machaan. 
              Our eco-friendly resort offers an unforgettable escape from the ordinary.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-primary-300 hover:text-secondary-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-300 hover:text-secondary-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-300 hover:text-secondary-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-secondary-600" />
                <span className="text-primary-200">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-secondary-600" />
                <span className="text-primary-200">info@villagemachaan.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-secondary-600 mt-1" />
                <span className="text-primary-200">
                  Village Machaan Resort<br />
                  Forest Hills, Nature Valley<br />
                  Pin: 123456
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <a href="#" className="block text-primary-200 hover:text-secondary-600 transition-colors">
                About Us
              </a>
              <a href="#" className="block text-primary-200 hover:text-secondary-600 transition-colors">
                Our Packages
              </a>
              <a href="#" className="block text-primary-200 hover:text-secondary-600 transition-colors">
                Safari Tours
              </a>
              <a href="#" className="block text-primary-200 hover:text-secondary-600 transition-colors">
                Gallery
              </a>
              <a href="#" className="block text-primary-200 hover:text-secondary-600 transition-colors">
                Reviews
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-300 text-sm">
            © 2025 Village Machaan Resort. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-primary-300 hover:text-secondary-600 text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-primary-300 hover:text-secondary-600 text-sm transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-primary-300 hover:text-secondary-600 text-sm transition-colors">
              Cancellation Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
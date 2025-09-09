import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Users, Mail, Phone, MapPin, DollarSign, Home } from 'lucide-react';
import { BookingService } from '../../services/bookingService';
import { VillaService } from '../../services/villaService';
import { PackageService } from '../../services/packageService';
import { InventoryService, VillaUnit } from '../../services/inventoryService';
import { useToast } from '../common/Toast';
import FormField from '../common/FormField';
import LoadingSpinner from '../common/LoadingSpinner';
import { ValidationService } from '../../utils/validation';

interface BookingEditModalProps {
  booking: any;
  onClose: () => void;
  onSave: () => void;
}

const BookingEditModal: React.FC<BookingEditModalProps> = ({ booking, onClose, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [villas, setVillas] = useState([]);
  const [packages, setPackages] = useState([]);
  const [availableUnits, setAvailableUnits] = useState<VillaUnit[]>([]);
  const [assignedUnit, setAssignedUnit] = useState<VillaUnit | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    email: '',
    phone: '',
    check_in: '',
    check_out: '',
    guests: 1,
    villa_id: '',
    villa_name: '',
    villa_price: 0,
    package_id: '',
    package_name: '',
    package_price: 0,
    special_requests: '',
    status: 'pending',
    payment_status: 'pending',
    advance_amount: 0,
    remaining_amount: 0,
    admin_notes: '',
    assigned_unit_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (booking) {
      setFormData({
        guest_name: booking.guest_name || '',
        email: booking.email || '',
        phone: booking.phone || '',
        check_in: booking.check_in || '',
        check_out: booking.check_out || '',
        guests: booking.guests || 1,
        villa_id: booking.villa_id || '',
        villa_name: booking.villa_name || '',
        villa_price: booking.villa_price || 0,
        package_id: booking.package_id || '',
        package_name: booking.package_name || '',
        package_price: booking.package_price || 0,
        special_requests: booking.special_requests || '',
        status: booking.status || 'pending',
        payment_status: booking.payment_status || 'pending',
        advance_amount: booking.advance_amount || 0,
        remaining_amount: booking.remaining_amount || 0,
        admin_notes: booking.admin_notes || '',
        assigned_unit_id: ''
      });
      
      // Load assigned unit and available units
      loadRoomData();
    }
    fetchVillasAndPackages();
  }, [booking]);

  const loadRoomData = async () => {
    if (!booking) return;
    
    try {
      // Get currently assigned unit
      const assigned = await InventoryService.getAssignedUnit(booking.booking_id);
      setAssignedUnit(assigned);
      
      if (assigned) {
        setFormData(prev => ({ ...prev, assigned_unit_id: assigned.id }));
      }
      
      // Load available units for the current villa and dates
      if (booking.villa_id && booking.check_in && booking.check_out) {
        setLoadingUnits(true);
        const units = await InventoryService.getAvailableUnitsForVilla(
          booking.villa_id, 
          booking.check_in, 
          booking.check_out
        );
        setAvailableUnits(units);
      }
    } catch (error) {
      console.error('Failed to load room data:', error);
    } finally {
      setLoadingUnits(false);
    }
  };

  const fetchVillasAndPackages = async () => {
    try {
      const [villasData, packagesData] = await Promise.all([
        VillaService.getAllVillas(),
        PackageService.getAllPackages()
      ]);
      setVillas(villasData);
      setPackages(packagesData);
    } catch (error) {
      console.error('Failed to fetch villas and packages:', error);
      showError('Loading Error', 'Failed to load villa and package data');
    }
  };

  const handleInputChange = async (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Update related fields when villa changes
      if (field === 'villa_id') {
        const selectedVilla = villas.find((v: any) => v.id === value);
        if (selectedVilla) {
          newData.villa_name = selectedVilla.name;
          newData.villa_price = selectedVilla.base_price;
        }
        // Clear assigned unit when villa changes
        newData.assigned_unit_id = '';
      }
      
      // Update related fields when package changes
      if (field === 'package_id') {
        const selectedPackage = packages.find((p: any) => p.id === value);
        if (selectedPackage) {
          newData.package_name = selectedPackage.name;
          newData.package_price = selectedPackage.price;
        } else if (value === '') {
          newData.package_name = '';
          newData.package_price = 0;
        }
      }
      
      // Recalculate remaining amount when advance amount changes
      if (field === 'advance_amount') {
        const nights = newData.check_in && newData.check_out ? 
          Math.ceil((new Date(newData.check_out).getTime() - new Date(newData.check_in).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const villaTotal = nights * newData.villa_price;
        const packageTotal = nights * newData.package_price;
        const subtotal = villaTotal + packageTotal;
        const taxes = Math.round(subtotal * 0.18);
        const total = subtotal + taxes;
        newData.remaining_amount = Math.max(0, total - (value || 0));
      }
      
      return newData;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Reload available units when villa or dates change
    if (field === 'villa_id' || field === 'check_in' || field === 'check_out') {
      const currentData = { ...formData, [field]: value };
      if (currentData.villa_id && currentData.check_in && currentData.check_out) {
        setLoadingUnits(true);
        try {
          const units = await InventoryService.getAvailableUnitsForVilla(
            currentData.villa_id,
            currentData.check_in,
            currentData.check_out
          );
          setAvailableUnits(units);
        } catch (error) {
          console.error('Failed to load available units:', error);
        } finally {
          setLoadingUnits(false);
        }
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Use the new admin booking form validation
    const validationErrors = ValidationService.validateAdminBookingForm({
      guest_name: formData.guest_name,
      email: formData.email,
      phone: formData.phone,
      check_in: formData.check_in,
      check_out: formData.check_out,
      guests: formData.guests,
      villa_id: formData.villa_id,
      advance_amount: formData.advance_amount,
      total_amount: calculateTotal()
    });

    // Convert validation errors to the expected format
    validationErrors.forEach(error => {
      newErrors[error.field] = error.message;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    const nights = formData.check_in && formData.check_out ? 
      Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    const villaTotal = nights * formData.villa_price;
    const packageTotal = nights * formData.package_price;
    const subtotal = villaTotal + packageTotal;
    const taxes = Math.round(subtotal * 0.18);
    
    return subtotal + taxes;
  };

  const calculateRemainingAmount = () => {
    const total = calculateTotal();
    return Math.max(0, total - formData.advance_amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      // Debug database connection first
      console.log('🔍 Debugging database before update...');
      await BookingService.debugDatabase();
      const updateData = {
        guest_name: formData.guest_name,
        email: formData.email,
        phone: formData.phone,
        check_in: formData.check_in,
        check_out: formData.check_out,
        guests: formData.guests,
        villa_id: formData.villa_id,
        villa_name: formData.villa_name,
        villa_price: formData.villa_price,
        package_id: formData.package_id || null,
        package_name: formData.package_name || null,
        package_price: formData.package_price,
        special_requests: formData.special_requests || null,
        status: formData.status,
        payment_status: formData.payment_status,
        admin_notes: formData.admin_notes || null
      };

      // Only include advance payment fields if they have values
      if (formData.advance_amount > 0 || formData.remaining_amount > 0) {
        updateData.advance_amount = formData.advance_amount;
        updateData.remaining_amount = calculateRemainingAmount();
      }

      console.log('🔄 Updating booking in edit modal:', booking.id, updateData);
      
      const result = await BookingService.updateBooking(booking.id, updateData);

      if (result.success) {
        console.log('✅ Booking update successful');
        
        // Handle room assignment if a specific unit is selected
        if (formData.assigned_unit_id && formData.villa_id && formData.check_in && formData.check_out) {
          try {
            const roomResult = await InventoryService.assignUnitToBooking(
              booking.booking_id,
              formData.assigned_unit_id,
              formData.check_in,
              formData.check_out
            );
            
            if (roomResult.success) {
              console.log('✅ Room assigned successfully');
              showSuccess('Booking Updated', 'Booking and room assignment updated successfully');
            } else {
              console.warn('⚠️ Room assignment failed:', roomResult.error);
              showSuccess('Booking Updated', 'Booking updated but room assignment failed');
            }
          } catch (error) {
            console.error('❌ Room assignment error:', error);
            showSuccess('Booking Updated', 'Booking updated but room assignment failed');
          }
        } else {
          showSuccess('Booking Updated', 'Booking updated successfully');
        }
        
        // Close modal and refresh data
        onSave();
      } else {
        console.error('❌ Booking update failed:', result.error);
        showError('Update Failed', result.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Booking update error:', error);
      showError('Update Failed', 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingBooking(null);
    // Force refresh of parent component
    onSave();
  };

  const nights = formData.check_in && formData.check_out ? 
    Math.ceil((new Date(formData.check_out).getTime() - new Date(formData.check_in).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-primary-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-primary-950">
              Edit Booking - #{booking.booking_id}
            </h3>
            <button
              onClick={onClose}
              className="text-primary-600 hover:text-primary-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Guest Information */}
          <div>
            <h4 className="text-lg font-semibold text-primary-950 mb-4">Guest Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Guest Name" required error={errors.guest_name || errors['Guest Name']}>
                <input
                  type="text"
                  value={formData.guest_name}
                  onChange={(e) => handleInputChange('guest_name', e.target.value)}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>

              <FormField label="Email" required error={errors.email}>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>

              <FormField label="Phone" required error={errors.phone}>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>

              <FormField label="Number of Guests" required error={errors.guests}>
                <input
                  type="number"
                  value={formData.guests}
                  onChange={(e) => handleInputChange('guests', parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>
            </div>
          </div>

          {/* Booking Details */}
          <div>
            <h4 className="text-lg font-semibold text-primary-950 mb-4">Booking Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Check-in Date" required error={errors.check_in}>
                <input
                  type="date"
                  value={formData.check_in}
                  onChange={(e) => handleInputChange('check_in', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>

              <FormField label="Check-out Date" required error={errors.check_out}>
                <input
                  type="date"
                  value={formData.check_out}
                  onChange={(e) => handleInputChange('check_out', e.target.value)}
                  min={formData.check_in || new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>

              <FormField label="Villa" required error={errors.villa_id}>
                <select
                  value={formData.villa_id}
                  onChange={(e) => handleInputChange('villa_id', e.target.value)}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                >
                  <option value="">Select Villa</option>
                  {villas.map((villa: any) => (
                    <option key={villa.id} value={villa.id}>
                      {villa.name} - ₹{villa.base_price.toLocaleString()}/night
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Package" error={errors.package_id}>
                <select
                  value={formData.package_id}
                  onChange={(e) => handleInputChange('package_id', e.target.value)}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                >
                  <option value="">No Package</option>
                  {packages.filter((pkg: any) => pkg.is_active).map((pkg: any) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - ₹{pkg.price.toLocaleString()}/night
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Booking Status" required>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </FormField>

              <FormField label="Payment Status" required>
                <select
                  value={formData.payment_status}
                  onChange={(e) => handleInputChange('payment_status', e.target.value)}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="advance_paid">Half Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="partial_refund">Partial Refund</option>
                </select>
              </FormField>

              <FormField label="Assigned Room" error={errors.assigned_unit_id}>
                <div className="space-y-2">
                  {assignedUnit && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Home className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Currently assigned: {assignedUnit.unit_number}
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        {assignedUnit.room_type} • Floor {assignedUnit.floor} • {assignedUnit.view_type}
                      </p>
                    </div>
                  )}
                  
                  <select
                    value={formData.assigned_unit_id}
                    onChange={(e) => handleInputChange('assigned_unit_id', e.target.value)}
                    disabled={loadingUnits}
                    className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors disabled:bg-gray-100"
                  >
                    <option value="">
                      {loadingUnits ? 'Loading rooms...' : 'Select a room (optional)'}
                    </option>
                    {availableUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unit_number} - {unit.room_type} • Floor {unit.floor} • {unit.view_type}
                      </option>
                    ))}
                  </select>
                  
                  {availableUnits.length === 0 && !loadingUnits && formData.villa_id && formData.check_in && formData.check_out && (
                    <p className="text-sm text-orange-600">
                      No rooms available for the selected dates. The booking will be handled automatically.
                    </p>
                  )}
                </div>
              </FormField>

              <FormField label="Advance Amount" error={errors.advance_amount}>
                <input
                  type="number"
                  value={formData.advance_amount}
                  onChange={(e) => handleInputChange('advance_amount', parseInt(e.target.value) || 0)}
                  min="0"
                  max={calculateTotal()}
                  className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
              </FormField>

              <FormField label="Remaining Amount" error={errors.remaining_amount}>
                <input
                  type="number"
                  value={calculateRemainingAmount()}
                  disabled
                  className="w-full p-3 border border-primary-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </FormField>
            </div>
          </div>

          {/* Special Requests */}
          <FormField label="Special Requests">
            <textarea
              value={formData.special_requests}
              onChange={(e) => handleInputChange('special_requests', e.target.value)}
              placeholder="Any special requests or notes..."
              rows={3}
              className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
            />
          </FormField>

          {/* Admin Notes */}
          <FormField label="Admin Notes">
            <textarea
              value={formData.admin_notes}
              onChange={(e) => handleInputChange('admin_notes', e.target.value)}
              placeholder="Internal admin notes (not visible to guests)..."
              rows={3}
              className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
            />
          </FormField>

          {/* Pricing Summary */}
          {nights > 0 && (
            <div className="bg-primary-50 rounded-lg p-6">
              <h4 className="font-semibold text-primary-950 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing Summary
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">
                    {formData.villa_name || 'Villa'} ({nights} night{nights !== 1 ? 's' : ''})
                  </span>
                  <span className="text-primary-950 font-medium">₹{(nights * formData.villa_price).toLocaleString()}</span>
                </div>
                {formData.package_price > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-primary-700">
                      {formData.package_name || 'Package'} ({nights} night{nights !== 1 ? 's' : ''})
                    </span>
                    <span className="text-primary-950 font-medium">₹{(nights * formData.package_price).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-primary-700">Taxes & Fees (18%)</span>
                  <span className="text-primary-950 font-medium">₹{Math.round((nights * (formData.villa_price + formData.package_price)) * 0.18).toLocaleString()}</span>
                </div>
                <div className="border-t border-primary-200 pt-3">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span className="text-primary-950">Total Amount</span>
                    <span className="text-secondary-600">₹{calculateTotal().toLocaleString()}</span>
                  </div>
                  {formData.advance_amount > 0 && (
                    <div className="mt-2 pt-2 border-t border-orange-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-orange-700">Advance Paid</span>
                        <span className="text-orange-600 font-medium">₹{formData.advance_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-orange-700">Remaining Amount</span>
                        <span className="text-orange-600 font-medium">₹{calculateRemainingAmount().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-orange-500 mt-1">
                        <span>Payment Status: {formData.payment_status}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-primary-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-secondary-600 hover:bg-secondary-700 disabled:bg-primary-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="text-white" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Booking
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingEditModal;
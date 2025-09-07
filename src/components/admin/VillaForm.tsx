import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2, Plus } from 'lucide-react';
import { VillaService } from '../../services/villaService';
import { useToast } from '../common/Toast';
import FormField from '../common/FormField';
import LoadingSpinner from '../common/LoadingSpinner';

interface VillaFormProps {
  villa?: any;
  onClose: () => void;
  onSave: () => void;
}

const VillaForm: React.FC<VillaFormProps> = ({ villa, onClose, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    base_price: 0,
    max_guests: 2,
    amenities: [],
    images: [],
    status: 'active'
  });
  const [newAmenity, setNewAmenity] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (villa) {
      setFormData({
        id: villa.id || '',
        name: villa.name || '',
        description: villa.description || '',
        base_price: villa.base_price || 0,
        max_guests: villa.max_guests || 2,
        amenities: villa.amenities || [],
        images: villa.images || [],
        status: villa.status || 'active'
      });
    }
  }, [villa]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const addImage = () => {
    if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  const removeImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Villa name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.base_price <= 0) {
      newErrors.base_price = 'Base price must be greater than 0';
    }
    if (formData.max_guests <= 0) {
      newErrors.max_guests = 'Max guests must be greater than 0';
    }
    if (!formData.id.trim()) {
      newErrors.id = 'Villa ID is required';
    }
    if (!/^[a-z0-9-]+$/.test(formData.id)) {
      newErrors.id = 'Villa ID can only contain lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the errors below');
      return;
    }

    setLoading(true);
    try {
      const villaData = {
        id: formData.id,
        name: formData.name,
        description: formData.description,
        base_price: formData.base_price,
        max_guests: formData.max_guests,
        amenities: formData.amenities,
        images: formData.images,
        status: formData.status
      };

      let result;
      if (villa) {
        console.log('🔄 Updating villa:', formData.id);
        result = await VillaService.updateVilla(villa.id, villaData);
      } else {
        console.log('➕ Creating new villa:', formData.id);
        result = await VillaService.createVilla(villaData);
      }

      if (result.success) {
        console.log('✅ Villa operation successful');
        showSuccess(
          villa ? 'Villa Updated' : 'Villa Created',
          villa ? 'Villa updated successfully' : 'Villa created successfully'
        );
        onSave();
      } else {
        console.error('❌ Villa operation failed:', result.error);
        showError('Save Failed', result.error || 'Failed to save villa');
      }
    } catch (error) {
      console.error('❌ Villa form submission error:', error);
      showError('Save Failed', 'Failed to save villa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-primary-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-primary-950">
              {villa ? 'Edit Villa' : 'Add New Villa'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Villa ID" required error={errors.id}>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="e.g., glass-cottage"
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                disabled={!!villa}
              />
              <p className="text-xs text-primary-600 mt-1">
                Lowercase letters, numbers, and hyphens only. Cannot be changed after creation.
              </p>
            </FormField>

            <FormField label="Villa Name" required error={errors.name}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Glass Cottage"
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
              />
            </FormField>
          </div>

          <FormField label="Description" required error={errors.description}>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the villa features, location, and unique selling points..."
              rows={4}
              className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Base Price (₹)" required error={errors.base_price}>
              <input
                type="number"
                value={formData.base_price}
                onChange={(e) => handleInputChange('base_price', parseInt(e.target.value) || 0)}
                placeholder="15000"
                min="0"
                step="500"
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
              />
            </FormField>

            <FormField label="Max Guests" required error={errors.max_guests}>
              <input
                type="number"
                value={formData.max_guests}
                onChange={(e) => handleInputChange('max_guests', parseInt(e.target.value) || 0)}
                placeholder="4"
                min="1"
                max="20"
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
              />
            </FormField>

            <FormField label="Status" required>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </FormField>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-primary-800 font-medium mb-2">Amenities</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add amenity (e.g., Forest View, Private Pool)..."
                className="flex-1 p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              />
              <button
                type="button"
                onClick={addAmenity}
                disabled={!newAmenity.trim()}
                className="bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity)}
                    className="text-primary-600 hover:text-error-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {formData.amenities.length === 0 && (
              <p className="text-primary-500 text-sm mt-2">No amenities added yet. Add some to highlight villa features.</p>
            )}
          </div>

          {/* Images */}
          <div>
            <label className="block text-primary-800 font-medium mb-2">Images</label>
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Add image URL (e.g., /images/villa-name/main.jpg)..."
                className="flex-1 p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
              />
              <button
                type="button"
                onClick={addImage}
                disabled={!newImageUrl.trim()}
                className="bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.images.map((image, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg">
                  <img 
                    src={image} 
                    alt={`Villa ${index + 1}`}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/images/glass-cottage/main.jpg';
                    }}
                  />
                  <span className="flex-1 text-sm text-primary-700 break-all">{image}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(image)}
                    className="text-error-600 hover:text-error-700 transition-colors p-1 rounded hover:bg-error-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {formData.images.length === 0 && (
              <p className="text-primary-500 text-sm mt-2">No images added yet. Add at least one image to showcase the villa.</p>
            )}
          </div>

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
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {villa ? 'Update Villa' : 'Create Villa'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VillaForm;
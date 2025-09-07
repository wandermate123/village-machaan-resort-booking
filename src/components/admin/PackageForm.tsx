import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { PackageService } from '../../services/packageService';
import { useToast } from '../common/Toast';
import FormField from '../common/FormField';
import LoadingSpinner from '../common/LoadingSpinner';

interface PackageFormProps {
  package?: any;
  onClose: () => void;
  onSave: () => void;
}

const PackageForm: React.FC<PackageFormProps> = ({ package: pkg, onClose, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: 0,
    duration: 'Per night',
    inclusions: [],
    images: [],
    is_active: true
  });
  const [newInclusion, setNewInclusion] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pkg) {
      setFormData({
        id: pkg.id || '',
        name: pkg.name || '',
        description: pkg.description || '',
        price: pkg.price || 0,
        duration: pkg.duration || 'Per night',
        inclusions: pkg.inclusions || [],
        images: pkg.images || [],
        is_active: pkg.is_active !== undefined ? pkg.is_active : true
      });
    }
  }, [pkg]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addInclusion = () => {
    if (newInclusion.trim() && !formData.inclusions.includes(newInclusion.trim())) {
      setFormData(prev => ({
        ...prev,
        inclusions: [...prev.inclusions, newInclusion.trim()]
      }));
      setNewInclusion('');
    }
  };

  const removeInclusion = (inclusion: string) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter(i => i !== inclusion)
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

    if (!formData.id.trim()) {
      newErrors.id = 'Package ID is required';
    }
    if (!/^[a-z0-9-]+$/.test(formData.id)) {
      newErrors.id = 'Package ID can only contain lowercase letters, numbers, and hyphens';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Package name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }
    if (formData.inclusions.length === 0) {
      newErrors.inclusions = 'At least one inclusion is required';
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
      let result;
      if (pkg) {
        console.log('🔄 Updating package:', formData.id);
        result = await PackageService.updatePackage(pkg.id, formData);
      } else {
        console.log('➕ Creating new package:', formData.id);
        result = await PackageService.createPackage(formData);
      }

      if (result.success) {
        console.log('✅ Package operation successful');
        showSuccess(
          pkg ? 'Package Updated' : 'Package Created',
          pkg ? 'Package updated successfully' : 'Package created successfully'
        );
        onSave();
      } else {
        console.error('❌ Package operation failed:', result.error);
        showError('Save Failed', result.error || 'Failed to save package');
      }
    } catch (error) {
      console.error('❌ Package form submission error:', error);
      showError('Save Failed', 'Failed to save package');
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
              {pkg ? 'Edit Package' : 'Add New Package'}
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
            <FormField label="Package ID" required error={errors.id}>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="e.g., breakfast-package"
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                disabled={!!pkg}
              />
              <p className="text-xs text-primary-600 mt-1">
                Lowercase letters, numbers, and hyphens only. Cannot be changed after creation.
              </p>
            </FormField>

            <FormField label="Package Name" required error={errors.name}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Breakfast Package"
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
              />
            </FormField>
          </div>

          <FormField label="Description" required error={errors.description}>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what's included in this package and its benefits..."
              rows={4}
              className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Price (₹)" required error={errors.price}>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                placeholder="500"
                min="0"
                step="100"
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
              />
              <p className="text-xs text-primary-600 mt-1">
                Set to 0 for free packages
              </p>
            </FormField>

            <FormField label="Duration" required>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
              >
                <option value="Per night">Per night</option>
                <option value="Per stay">Per stay</option>
                <option value="Per person">Per person</option>
                <option value="One-time">One-time</option>
              </select>
            </FormField>

            <FormField label="Status" required>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>

          {/* Inclusions */}
          <div>
            <FormField label="Package Inclusions" required error={errors.inclusions}>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  placeholder="Add inclusion (e.g., Daily breakfast for all guests)..."
                  className="flex-1 p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclusion())}
                />
                <button
                  type="button"
                  onClick={addInclusion}
                  disabled={!newInclusion.trim()}
                  className="bg-secondary-600 hover:bg-secondary-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {formData.inclusions.map((inclusion, index) => (
                  <div
                    key={index}
                    className="bg-primary-100 text-primary-700 px-3 py-2 rounded-lg text-sm flex items-center justify-between"
                  >
                    <span>{inclusion}</span>
                    <button
                      type="button"
                      onClick={() => removeInclusion(inclusion)}
                      className="text-primary-600 hover:text-error-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {formData.inclusions.length === 0 && (
                <p className="text-primary-500 text-sm mt-2">No inclusions added yet. Add what's included in this package.</p>
              )}
            </FormField>
          </div>

          {/* Images */}
          <div>
            <label className="block text-primary-800 font-medium mb-2">Package Images (Optional)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Add image URL (e.g., /images/packages/breakfast.jpg)..."
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
                    alt={`Package ${index + 1}`}
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
                  {pkg ? 'Update Package' : 'Create Package'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageForm;
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, DollarSign, Clock, Star, X, Eye, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { PackageService } from '../../services/packageService';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import PackageForm from './PackageForm';

const PackageManagement = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [showPackageDetails, setShowPackageDetails] = useState(null);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    setShowBulkActions(selectedPackages.length > 0);
  }, [selectedPackages]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const packagesData = await PackageService.getAllPackages();
      
      // Get real stats for each package
      const packagesWithStats = await Promise.all(
        packagesData.map(async (pkg) => {
          try {
            const stats = await PackageService.getPackageStats(pkg.id);
            return {
              ...pkg,
              bookings: stats.totalBookings,
              revenue: stats.totalRevenue,
              popularityScore: stats.popularityScore
            };
          } catch (statsError) {
            console.warn(`Failed to get stats for package ${pkg.id}:`, statsError);
            return {
              ...pkg,
              bookings: 0,
              revenue: 0,
              popularityScore: 0
            };
          }
        })
      );
      
      setPackages(packagesWithStats);
      console.log(`✅ Loaded ${packagesWithStats.length} packages with stats`);
    } catch (error) {
      console.error('Failed to fetch packages:', error);
      showError('Loading Error', 'Failed to load package data');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshPackages = async () => {
    setRefreshing(true);
    try {
      await fetchPackages();
      showInfo('Data Refreshed', 'Package data has been updated');
    } catch (error) {
      showError('Refresh Failed', 'Failed to refresh package data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusToggle = async (packageId: string) => {
    try {
      const { success, error } = await PackageService.togglePackageStatus(packageId);
      if (success) {
        showSuccess('Status Updated', 'Package status updated successfully');
        await fetchPackages();
      } else {
        showError('Update Failed', error || 'Failed to update package status');
      }
    } catch (error) {
      showError('Update Failed', 'Failed to update package status');
    }
  };

  const handleDeletePackage = (pkg: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Package',
      message: `Are you sure you want to delete "${pkg.name}"? This will affect existing bookings and cannot be undone.`,
      onConfirm: async () => {
        try {
          const { success, error } = await PackageService.deletePackage(pkg.id);
          if (success) {
            showSuccess('Package Deleted', 'Package deleted successfully');
            await fetchPackages();
          } else {
            showError('Delete Failed', error || 'Failed to delete package');
          }
        } catch (error) {
          showError('Delete Failed', 'Failed to delete package');
        }
      }
    });
  };

  const handleEditPackage = (pkg: any) => {
    setEditingPackage(pkg);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPackage(null);
    fetchPackages();
  };

  const handleViewDetails = (pkg: any) => {
    setShowPackageDetails(pkg);
  };

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPackages.length === packages.length) {
      setSelectedPackages([]);
    } else {
      setSelectedPackages(packages.map((pkg: any) => pkg.id));
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Bulk Status Update',
      message: `Are you sure you want to ${isActive ? 'activate' : 'deactivate'} ${selectedPackages.length} package(s)?`,
      onConfirm: async () => {
        try {
          const result = await PackageService.bulkUpdatePackageStatus(selectedPackages, isActive);
          if (result.success) {
            showSuccess('Bulk Update Complete', `Updated ${selectedPackages.length} packages`);
            setSelectedPackages([]);
            await fetchPackages();
          } else {
            showError('Bulk Update Failed', result.error || 'Failed to update package statuses');
          }
        } catch (error) {
          showError('Bulk Update Failed', 'Failed to update package statuses');
        }
      }
    });
  };

  const totalRevenue = packages.reduce((sum, pkg) => sum + pkg.revenue, 0);
  const totalBookings = packages.reduce((sum, pkg) => sum + pkg.bookings, 0);
  const avgPackageValue = packages.length > 0 ? packages.reduce((sum, pkg) => sum + pkg.price, 0) / packages.length : 0;
  const activePackages = packages.filter(p => p.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-950">Package Management</h1>
          <p className="text-primary-700 mt-1">Manage experience packages and pricing</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={refreshPackages}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Package
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Total Packages</p>
              <p className="text-2xl font-bold text-primary-950">{packages.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Active Packages</p>
              <p className="text-2xl font-bold text-success-600">{activePackages}</p>
            </div>
            <Star className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Package Revenue</p>
              <p className="text-2xl font-bold text-secondary-600">₹{totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-600 text-sm font-medium">Avg Package Value</p>
              <p className="text-2xl font-bold text-primary-950">₹{Math.round(avgPackageValue).toLocaleString()}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedPackages.length} package(s) selected
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkStatusUpdate(true)}
                className="bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Activate Selected
              </button>
              <button 
                onClick={() => handleBulkStatusUpdate(false)}
                className="bg-error-600 hover:bg-error-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Deactivate Selected
              </button>
              <button 
                onClick={() => setSelectedPackages([])}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {packages.length > 0 ? (
            packages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-xl shadow-lg border border-primary-100">
                {/* Package Header with Selection */}
                <div className="p-4 border-b border-primary-100">
                  <div className="flex items-center justify-between">
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(pkg.id)}
                      onChange={() => handleSelectPackage(pkg.id)}
                      className="rounded border-primary-300 text-secondary-600 focus:ring-secondary-500"
                    />
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewDetails(pkg)}
                        className="text-blue-600 hover:text-blue-700 transition-colors p-1 rounded hover:bg-blue-100"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditPackage(pkg)}
                        className="text-primary-600 hover:text-secondary-600 transition-colors p-1 rounded hover:bg-primary-100"
                        title="Edit Package"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePackage(pkg)}
                        className="text-error-600 hover:text-error-700 transition-colors p-1 rounded hover:bg-error-100"
                        title="Delete Package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-primary-950">{pkg.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pkg.is_active 
                          ? 'bg-success-100 text-success-700' 
                          : 'bg-error-100 text-error-700'
                      }`}>
                        {pkg.is_active ? 'active' : 'inactive'}
                      </span>
                    </div>
                    <p className="text-primary-700 text-sm line-clamp-2">{pkg.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center bg-secondary-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-secondary-600">
                        {pkg.price === 0 ? 'Free' : `₹${pkg.price.toLocaleString()}`}
                      </p>
                      <p className="text-primary-600 text-sm">{pkg.duration}</p>
                    </div>
                    <div className="text-center bg-primary-50 rounded-lg p-3">
                      <p className="text-lg font-bold text-primary-950">{pkg.popularityScore}%</p>
                      <p className="text-primary-600 text-sm">Popularity</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-primary-950 mb-2">Inclusions:</h4>
                    <ul className="space-y-1">
                      {pkg.inclusions?.slice(0, 3).map((inclusion, idx) => (
                        <li key={idx} className="text-primary-700 text-sm flex items-center">
                          <div className="w-1 h-1 bg-secondary-500 rounded-full mr-2" />
                          {inclusion}
                        </li>
                      ))}
                      {pkg.inclusions?.length > 3 && (
                        <li className="text-primary-600 text-sm">
                          +{pkg.inclusions.length - 3} more inclusions
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-primary-600">Bookings</p>
                      <p className="font-semibold text-primary-950">{pkg.bookings}</p>
                    </div>
                    <div>
                      <p className="text-primary-600">Revenue</p>
                      <p className="font-semibold text-secondary-600">₹{pkg.revenue.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => handleStatusToggle(pkg.id)}
                      className="flex items-center space-x-2 text-sm font-medium transition-colors"
                    >
                      {pkg.is_active ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-success-600" />
                          <span className="text-success-600">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-error-600" />
                          <span className="text-error-600">Inactive</span>
                        </>
                      )}
                    </button>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Edit Package
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-primary-300" />
              <h3 className="text-xl font-medium text-primary-600 mb-2">No Packages Yet</h3>
              <p className="text-primary-500 mb-6">Create your first experience package</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add First Package
              </button>
            </div>
          )}
        </div>
      )}

      {/* Package Form Modal */}
      {showAddModal && (
        <PackageForm
          package={editingPackage}
          onClose={handleCloseModal}
          onSave={handleCloseModal}
        />
      )}

      {/* Package Details Modal */}
      {showPackageDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-primary-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary-950">
                  {showPackageDetails.name}
                </h3>
                <button
                  onClick={() => setShowPackageDetails(null)}
                  className="text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-primary-950 mb-2">Description</h4>
                  <p className="text-primary-700">{showPackageDetails.description}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-secondary-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-secondary-600">
                      {showPackageDetails.price === 0 ? 'Free' : `₹${showPackageDetails.price.toLocaleString()}`}
                    </p>
                    <p className="text-primary-600 text-sm">{showPackageDetails.duration}</p>
                  </div>
                  <div className="bg-primary-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-primary-950">{showPackageDetails.bookings}</p>
                    <p className="text-primary-600 text-sm">Total Bookings</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">₹{showPackageDetails.revenue.toLocaleString()}</p>
                    <p className="text-primary-600 text-sm">Revenue</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-primary-950 mb-3">Package Inclusions</h4>
                  <ul className="space-y-2">
                    {showPackageDetails.inclusions?.map((inclusion, idx) => (
                      <li key={idx} className="text-primary-700 text-sm flex items-center">
                        <div className="w-2 h-2 bg-secondary-500 rounded-full mr-3" />
                        {inclusion}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowPackageDetails(null);
                      handleEditPackage(showPackageDetails);
                    }}
                    className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Package
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type="danger"
      />
    </div>
  );
};

export default PackageManagement;
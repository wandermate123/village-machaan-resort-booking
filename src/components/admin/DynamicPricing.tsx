import React, { useState } from 'react';
import { Plus, Edit, Trash2, TrendingUp, Calendar, Percent } from 'lucide-react';

const DynamicPricing = () => {
  const [pricingRules, setPricingRules] = useState([
    {
      id: '1',
      name: 'Weekend Premium',
      type: 'weekend',
      modifier: 1.3,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      villas: ['all'],
      isActive: true
    },
    {
      id: '2',
      name: 'Holiday Season',
      type: 'holiday',
      modifier: 1.8,
      startDate: '2024-12-20',
      endDate: '2024-01-05',
      villas: ['kingfisher-villa', 'hornbill-villa'],
      isActive: true
    },
    {
      id: '3',
      name: 'Summer Discount',
      type: 'seasonal',
      modifier: 0.8,
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      villas: ['glass-cottage'],
      isActive: false
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'weekend': return 'bg-blue-100 text-blue-700';
      case 'holiday': return 'bg-red-100 text-red-700';
      case 'seasonal': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getModifierDisplay = (modifier: number) => {
    const percentage = Math.round((modifier - 1) * 100);
    if (percentage > 0) {
      return `+${percentage}%`;
    } else if (percentage < 0) {
      return `${percentage}%`;
    }
    return 'Base Price';
  };

  const toggleRuleStatus = (ruleId: string) => {
    setPricingRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-primary-950">Dynamic Pricing</h2>
          <p className="text-primary-700 mt-1">Manage seasonal rates and pricing rules</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Pricing Rule
        </button>
      </div>

      {/* Pricing Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pricingRules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary-950">{rule.name}</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getRuleTypeColor(rule.type)}`}>
                  {rule.type}
                </span>
              </div>
              <div className="flex space-x-2">
                <button className="text-primary-600 hover:text-secondary-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="text-error-600 hover:text-error-700 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center bg-primary-50 rounded-lg p-3">
                <div className="flex items-center justify-center mb-1">
                  <Percent className="w-4 h-4 text-primary-600 mr-1" />
                  <span className="text-lg font-bold text-primary-950">
                    {getModifierDisplay(rule.modifier)}
                  </span>
                </div>
                <p className="text-primary-600 text-xs">Price Change</p>
              </div>
              <div className="text-center bg-secondary-50 rounded-lg p-3">
                <div className="flex items-center justify-center mb-1">
                  <Calendar className="w-4 h-4 text-secondary-600 mr-1" />
                  <span className="text-sm font-bold text-primary-950">
                    {new Date(rule.startDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-primary-600 text-xs">Start Date</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-primary-600 text-sm mb-2">Applies to:</p>
              <div className="flex flex-wrap gap-1">
                {rule.villas.map((villa, idx) => (
                  <span key={idx} className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">
                    {villa === 'all' ? 'All Villas' : villa.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                rule.isActive 
                  ? 'bg-success-100 text-success-700' 
                  : 'bg-error-100 text-error-700'
              }`}>
                {rule.isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => toggleRuleStatus(rule.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  rule.isActive
                    ? 'bg-error-100 text-error-700 hover:bg-error-200'
                    : 'bg-success-100 text-success-700 hover:bg-success-200'
                }`}
              >
                {rule.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Preview */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
        <h3 className="text-xl font-semibold text-primary-950 mb-4">Pricing Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <h4 className="font-medium text-primary-950 mb-2">Glass Cottage</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Base Rate:</span>
                <span className="text-primary-950">₹15,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Weekend Rate:</span>
                <span className="text-secondary-600 font-semibold">₹19,500</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Holiday Rate:</span>
                <span className="text-red-600 font-semibold">₹24,300</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="font-medium text-primary-950 mb-2">Hornbill Villa</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Base Rate:</span>
                <span className="text-primary-950">₹18,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Weekend Rate:</span>
                <span className="text-secondary-600 font-semibold">₹23,400</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Holiday Rate:</span>
                <span className="text-red-600 font-semibold">₹29,700</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="font-medium text-primary-950 mb-2">Kingfisher Villa</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Base Rate:</span>
                <span className="text-primary-950">₹22,000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Weekend Rate:</span>
                <span className="text-secondary-600 font-semibold">₹28,600</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-600">Holiday Rate:</span>
                <span className="text-red-600 font-semibold">₹35,640</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPricing;
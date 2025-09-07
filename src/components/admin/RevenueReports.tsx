import React, { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, DollarSign, Package, Home, Filter, FileText, BarChart } from 'lucide-react';
import { BookingService } from '../../services/bookingService';
import { VillaService } from '../../services/villaService';
import { PackageService } from '../../services/packageService';
import { useToast } from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';

const RevenueReports = () => {
  const { showSuccess, showInfo, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [villaFilter, setVillaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    villaRevenue: 0,
    packageRevenue: 0,
    growth: 0,
    bookingsCount: 0,
    avgBookingValue: 0
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [topVillas, setTopVillas] = useState([]);
  const [villas, setVillas] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType, villaFilter, statusFilter]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Get date range
      const { startDate, endDate } = getDateRange(dateRange);
      
      // Fetch all data
      const [bookings, villasData, packages] = await Promise.all([
        BookingService.getBookings({
          dateFrom: startDate,
          dateTo: endDate,
          villaId: villaFilter !== 'all' ? villaFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }),
        VillaService.getAllVillas(),
        PackageService.getAllPackages()
      ]);

      setVillas(villasData);

      // Calculate revenue metrics
      const paidBookings = bookings.filter((b: any) => b.payment_status === 'paid');
      const totalRevenue = paidBookings.reduce((sum: number, b: any) => sum + b.total_amount, 0);
      const villaRevenue = paidBookings.reduce((sum: number, b: any) => sum + b.villa_price, 0);
      const packageRevenue = paidBookings.reduce((sum: number, b: any) => sum + (b.package_price || 0), 0);
      
      // Calculate growth (compare with previous period)
      const previousPeriodBookings = await BookingService.getBookings({
        dateFrom: getPreviousPeriodStart(startDate, dateRange),
        dateTo: startDate
      });
      const previousRevenue = previousPeriodBookings
        .filter((b: any) => b.payment_status === 'paid')
        .reduce((sum: number, b: any) => sum + b.total_amount, 0);
      
      const growth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      setRevenueData({
        totalRevenue,
        villaRevenue,
        packageRevenue,
        growth,
        bookingsCount: bookings.length,
        avgBookingValue: paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0
      });

      // Generate monthly data for chart
      const monthlyStats = generateMonthlyData(paidBookings);
      setMonthlyData(monthlyStats);

      // Calculate top performing villas
      const villaStats = villasData.map((villa: any) => {
        const villaBookings = paidBookings.filter((b: any) => b.villa_id === villa.id);
        const revenue = villaBookings.reduce((sum: number, b: any) => sum + b.villa_price, 0);
        return {
          ...villa,
          bookings: villaBookings.length,
          revenue
        };
      });

      villaStats.sort((a, b) => b.revenue - a.revenue);
      setTopVillas(villaStats.slice(0, 5));

    } catch (error) {
      showError('Loading Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (range: string) => {
    const now = new Date();
    let startDate: string;
    let endDate = now.toISOString().split('T')[0];

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }

    return { startDate, endDate };
  };

  const getPreviousPeriodStart = (currentStart: string, range: string) => {
    const start = new Date(currentStart);
    
    switch (range) {
      case 'week':
        return new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'month':
        return new Date(start.getFullYear(), start.getMonth() - 1, 1).toISOString().split('T')[0];
      case 'quarter':
        return new Date(start.getFullYear(), start.getMonth() - 3, 1).toISOString().split('T')[0];
      case 'year':
        return new Date(start.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
      default:
        return new Date(start.getFullYear(), start.getMonth() - 1, 1).toISOString().split('T')[0];
    }
  };

  const generateMonthlyData = (bookings: any[]) => {
    const monthlyStats: Record<string, { revenue: number; bookings: number }> = {};
    
    bookings.forEach((booking: any) => {
      const month = new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyStats[month]) {
        monthlyStats[month] = { revenue: 0, bookings: 0 };
      }
      monthlyStats[month].revenue += booking.total_amount;
      monthlyStats[month].bookings += 1;
    });

    return Object.entries(monthlyStats).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings
    }));
  };

  const handleExportReport = () => {
    showSuccess('Export Started', 'Your report is being generated and will be downloaded shortly');
    
    setTimeout(() => {
      const csvContent = generateCSVReport();
      downloadCSV(csvContent, `revenue-report-${dateRange}-${Date.now()}.csv`);
    }, 1000);
  };

  const generateCSVReport = () => {
    const headers = ['Period', 'Revenue', 'Bookings', 'Avg Booking Value'];
    const rows = monthlyData.map((data: any) => [
      data.month,
      data.revenue,
      data.bookings,
      data.bookings > 0 ? Math.round(data.revenue / data.bookings) : 0
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'dateRange') {
      setDateRange(value);
    } else if (filterType === 'reportType') {
      setReportType(value);
    } else if (filterType === 'villa') {
      setVillaFilter(value);
    } else if (filterType === 'status') {
      setStatusFilter(value);
    }
    showInfo('Filter Applied', `Report updated for ${value}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary-950">Revenue Reports</h1>
          <p className="text-primary-700 mt-1">Analytics and financial insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="bg-primary-800 hover:bg-primary-900 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button 
            onClick={handleExportReport}
            className="bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
          <h3 className="text-lg font-semibold text-primary-950 mb-4">Report Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-primary-800 font-medium mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => handleFilterChange('reportType', e.target.value)}
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
              >
                <option value="overview">Revenue Overview</option>
                <option value="villa">Villa Performance</option>
                <option value="package">Package Analysis</option>
                <option value="guest">Guest Analytics</option>
              </select>
            </div>
            
            <div>
              <label className="block text-primary-800 font-medium mb-2">Villa Filter</label>
              <select 
                value={villaFilter}
                onChange={(e) => handleFilterChange('villa', e.target.value)}
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
              >
                <option value="all">All Villas</option>
                {villas.map((villa: any) => (
                  <option key={villa.id} value={villa.id}>{villa.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-primary-800 font-medium mb-2">Status Filter</label>
              <select 
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors"
              >
                <option value="all">All Bookings</option>
                <option value="confirmed">Confirmed Only</option>
                <option value="completed">Completed Only</option>
                <option value="cancelled">Cancelled Only</option>
              </select>
            </div>

            <div>
              <label className="block text-primary-800 font-medium mb-2">Export Format</label>
              <select className="w-full p-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-secondary-500 transition-colors">
                <option value="csv">CSV Format</option>
                <option value="pdf">PDF Report</option>
                <option value="excel">Excel Format</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-primary-950">Total Revenue</h2>
                <div className="flex items-center text-success-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">
                    {revenueData.growth >= 0 ? '+' : ''}{revenueData.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <p className="text-4xl font-bold text-secondary-600 mb-2">
                ₹{revenueData.totalRevenue.toLocaleString()}
              </p>
              <p className="text-primary-700">vs last {dateRange}</p>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Home className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-primary-600">Villa Revenue</span>
                  </div>
                  <p className="text-xl font-bold text-primary-950 mt-2">
                    ₹{revenueData.villaRevenue.toLocaleString()}
                  </p>
                  <p className="text-primary-600 text-xs">
                    {revenueData.totalRevenue > 0 ? Math.round((revenueData.villaRevenue / revenueData.totalRevenue) * 100) : 0}% of total
                  </p>
                </div>
                <div className="bg-secondary-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <Package className="w-5 h-5 text-secondary-600" />
                    <span className="text-sm font-medium text-secondary-600">Package Revenue</span>
                  </div>
                  <p className="text-xl font-bold text-primary-950 mt-2">
                    ₹{revenueData.packageRevenue.toLocaleString()}
                  </p>
                  <p className="text-primary-600 text-xs">
                    {revenueData.totalRevenue > 0 ? Math.round((revenueData.packageRevenue / revenueData.totalRevenue) * 100) : 0}% of total
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-primary-600">Total Bookings</span>
                </div>
                <p className="text-2xl font-bold text-primary-950">{revenueData.bookingsCount}</p>
                <p className="text-primary-700 text-sm">this {dateRange}</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-primary-600">Avg Booking Value</span>
                </div>
                <p className="text-2xl font-bold text-primary-950">₹{Math.round(revenueData.avgBookingValue).toLocaleString()}</p>
                <p className="text-primary-700 text-sm">per booking</p>
              </div>
            </div>
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <h2 className="text-xl font-semibold text-primary-950 mb-6">Revenue Trend</h2>
              {monthlyData.length > 0 ? (
                <div className="space-y-4">
                  {monthlyData.map((data: any, index) => {
                    const maxRevenue = Math.max(...monthlyData.map((d: any) => d.revenue));
                    const widthPercentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <span className="text-primary-700 font-medium w-8">{data.month}</span>
                          <div className="flex-1">
                            <div className="bg-primary-100 rounded-full h-3 w-32">
                              <div 
                                className="bg-secondary-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${widthPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary-950">₹{data.revenue.toLocaleString()}</p>
                          <p className="text-primary-600 text-sm">{data.bookings} bookings</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-primary-600">
                  <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No revenue data for selected period</p>
                </div>
              )}
            </div>

            {/* Top Performing Villas */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <h2 className="text-xl font-semibold text-primary-950 mb-6">Top Performing Villas</h2>
              {topVillas.length > 0 ? (
                <div className="space-y-4">
                  {topVillas.map((villa: any, index) => (
                    <div key={villa.id} className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          index === 0 ? 'bg-secondary-600' : 
                          index === 1 ? 'bg-primary-600' : 'bg-primary-400'
                        }`}>
                          <span className="text-white font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-primary-950">{villa.name}</p>
                          <p className="text-primary-600 text-sm">{villa.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-secondary-600">₹{villa.revenue.toLocaleString()}</p>
                        <p className="text-primary-600 text-sm">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-primary-600">
                  <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No villa performance data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
            <h2 className="text-xl font-semibold text-primary-950 mb-6">Key Performance Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-primary-950">{revenueData.bookingsCount}</p>
                <p className="text-primary-600 text-sm">Total Bookings</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-primary-950">₹{Math.round(revenueData.avgBookingValue).toLocaleString()}</p>
                <p className="text-primary-600 text-sm">Avg Booking Value</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-primary-950">
                  {revenueData.growth >= 0 ? '+' : ''}{revenueData.growth.toFixed(1)}%
                </p>
                <p className="text-primary-600 text-sm">Growth Rate</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Home className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-primary-950">{villas.length}</p>
                <p className="text-primary-600 text-sm">Active Villas</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueReports;
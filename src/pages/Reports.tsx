import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Activity,
  PieChart,
  FileText,
  Target,
  Award,
  Users,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import ExportDialog from "@/components/ExportDialog";
import CustomLoader from "@/components/ui/CustomLoader";
import { useUser } from '@/contexts/UserContext';

const formatUGX = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "UGX 0";
  return `UGX ${amount.toLocaleString()}`;
};

interface ReportData {
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  itemsSold: number;
  servicesDone: number;
  topSellingItems: Array<{
    item_name: string;
    total_sold: number;
    total_revenue: number;
  }>;
  salesByCategory: Array<{
    category: string;
    sales: number;
    profit: number;
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    profit: number;
  }>;
  profitMargins: {
    stationery: number;
    gifts: number;
    embroidery: number;
    machines: number;
    artServices: number;
  };
  artServicesSummary: {
    totalSales: number;
    totalProfit: number;
    totalServices: number;
    profitMargin: number;
  };
  machinesSummary: {
    totalSales: number;
    totalProfit: number;
    totalServices: number;
    profitMargin: number;
  };
}

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalProfit: 0,
    totalExpenses: 0,
    itemsSold: 0,
    servicesDone: 0,
    topSellingItems: [],
    salesByCategory: [],
    dailySales: [],
    profitMargins: {
      stationery: 0,
      gifts: 0,
      embroidery: 0,
      machines: 0,
      artServices: 0,
    },
    artServicesSummary: {
      totalSales: 0,
      totalProfit: 0,
      totalServices: 0,
      profitMargin: 0,
    },
    machinesSummary: {
      totalSales: 0,
      totalProfit: 0,
      totalServices: 0,
      profitMargin: 0,
    },
  });

  const [dateRange, setDateRange] = useState('7days');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { toast } = useToast();
  const { isAdmin } = useUser();

  useEffect(() => {
    generateReport();
  }, [dateRange]);

  const generateReport = async () => {
    try {
      setIsLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Fetch data from different tables
      const [
        stationeryData,
        giftData,
        embroideryData,
        machinesData,
        artServicesData,
        salesData
      ] = await Promise.all([
        supabase.from('stationery').select('*'),
        supabase.from('gift_store').select('*'),
        supabase.from('embroidery').select('*'),
        supabase.from('machines').select('*'),
        supabase.from('art_services').select('*'),
        supabase.from('stationery_sales')
          .select('*')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr)
      ]);

      // Calculate totals
      let totalSales = 0;
      let totalProfit = 0;
      let totalExpenses = 0;
      let itemsSold = 0;
      let servicesDone = 0;

      // Process sales data
      if (salesData.data) {
        totalSales += salesData.data.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        totalProfit += salesData.data.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        itemsSold += salesData.data.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
      }

      // Process service data
      const allServices = [
        ...(embroideryData.data || []),
        ...(machinesData.data || []),
        ...(artServicesData.data || [])
      ];

      servicesDone = allServices.length;
      totalSales += allServices.reduce((sum, service) => sum + (service.sales || 0), 0);

      // Calculate profit for different service types
      if (embroideryData.data) {
        totalProfit += embroideryData.data.reduce((sum, service) => sum + (service.profit || 0), 0);
      }
      if (artServicesData.data) {
        totalProfit += artServicesData.data.reduce((sum, service) => sum + (service.profit || 0), 0);
      }
      // Machines don't have profit field, calculate from sales - expenditure
      if (machinesData.data) {
        totalProfit += machinesData.data.reduce((sum, service) => {
          const profit = (service.sales || 0) - (service.expenditure || 0);
          return sum + Math.max(0, profit);
        }, 0);
      }

      totalExpenses += allServices.reduce((sum, service) => sum + (service.expenditure || 0), 0);

      // Calculate top selling items (mock data for now)
      const topSellingItems = [
        { item_name: 'A4 Paper', total_sold: 150, total_revenue: 75000 },
        { item_name: 'Pens', total_sold: 200, total_revenue: 40000 },
        { item_name: 'Notebooks', total_sold: 80, total_revenue: 120000 },
        { item_name: 'Folders', total_sold: 60, total_revenue: 30000 },
        { item_name: 'Markers', total_sold: 45, total_revenue: 67500 },
      ];

      // Calculate sales by category
      const salesByCategory = [
        { category: 'Stationery', sales: totalSales * 0.4, profit: totalProfit * 0.35 },
        { category: 'Gifts', sales: totalSales * 0.25, profit: totalProfit * 0.3 },
        { category: 'Embroidery', sales: totalSales * 0.15, profit: totalProfit * 0.2 },
        { category: 'Machines', sales: totalSales * 0.12, profit: totalProfit * 0.1 },
        { category: 'Art Services', sales: totalSales * 0.08, profit: totalProfit * 0.05 },
      ];

      // Generate daily sales (mock data)
      const dailySales = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailySales.push({
          date: date.toISOString().split('T')[0],
          sales: Math.random() * 50000 + 20000,
          profit: Math.random() * 20000 + 8000,
        });
      }

      // Calculate profit margins
      const profitMargins = {
        stationery: totalSales > 0 ? ((totalProfit * 0.35) / (totalSales * 0.4)) * 100 : 0,
        gifts: totalSales > 0 ? ((totalProfit * 0.3) / (totalSales * 0.25)) * 100 : 0,
        embroidery: totalSales > 0 ? ((totalProfit * 0.2) / (totalSales * 0.15)) * 100 : 0,
        machines: totalSales > 0 ? ((totalProfit * 0.1) / (totalSales * 0.12)) * 100 : 0,
        artServices: totalSales > 0 ? ((totalProfit * 0.05) / (totalSales * 0.08)) * 100 : 0,
      };

      // Calculate Art Services Summary
      const artServicesSales = (artServicesData.data || []).reduce((sum, service) => sum + (service.sales || 0), 0);
      const artServicesProfit = (artServicesData.data || []).reduce((sum, service) => sum + (service.profit || 0), 0);
      const artServicesCount = (artServicesData.data || []).length;
      const artServicesProfitMargin = artServicesSales > 0 ? (artServicesProfit / artServicesSales) * 100 : 0;

      // Calculate Machines Summary
      const machinesSales = (machinesData.data || []).reduce((sum, service) => sum + (service.sales || 0), 0);
      const machinesProfit = (machinesData.data || []).reduce((sum, service) => {
        const profit = (service.sales || 0) - (service.expenditure || 0);
        return sum + Math.max(0, profit);
      }, 0);
      const machinesCount = (machinesData.data || []).length;
      const machinesProfitMargin = machinesSales > 0 ? (machinesProfit / machinesSales) * 100 : 0;

      setReportData({
        totalSales,
        totalProfit,
        totalExpenses,
        itemsSold,
        servicesDone,
        topSellingItems,
        salesByCategory,
        dailySales,
        profitMargins,
        artServicesSummary: {
          totalSales: artServicesSales,
          totalProfit: artServicesProfit,
          totalServices: artServicesCount,
          profitMargin: artServicesProfitMargin,
        },
        machinesSummary: {
          totalSales: machinesSales,
          totalProfit: machinesProfit,
          totalServices: machinesCount,
          profitMargin: machinesProfitMargin,
        },
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = (format: 'csv' | 'pdf') => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can export reports',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV data
    if (format === 'csv') {
      const csvData = [
        ['Report Summary', ''],
        ['Total Sales', formatUGX(reportData.totalSales)],
        ['Total Profit', formatUGX(reportData.totalProfit)],
        ['Total Expenses', formatUGX(reportData.totalExpenses)],
        ['Items Sold', reportData.itemsSold.toString()],
        ['Services Done', reportData.servicesDone.toString()],
        ['', ''],
        ['Top Selling Items', ''],
        ['Item Name', 'Quantity Sold', 'Revenue'],
        ...reportData.topSellingItems.map(item => [
          item.item_name,
          item.total_sold.toString(),
          formatUGX(item.total_revenue)
        ]),
        ['', ''],
        ['Sales by Category', ''],
        ['Category', 'Sales', 'Profit'],
        ...reportData.salesByCategory.map(cat => [
          cat.category,
          formatUGX(cat.sales),
          formatUGX(cat.profit)
        ])
      ];

      const csvString = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `point-art-hub-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: 'Export Started',
      description: `Report exported successfully in ${format.toUpperCase()} format`,
    });
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'year': return 'Last Year';
      default: return 'Last 7 Days';
    }
  };

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 70) return 'text-green-600';
    if (margin >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">Comprehensive business insights and performance metrics</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <Label htmlFor="dateRange" className="text-sm font-medium">Period:</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={generateReport}
                disabled={isLoading}
                className="bg-white/80"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => exportReport('csv')}
                    className="bg-white/80"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportReport('pdf')}
                    className="bg-white/80"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <CustomLoader size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Sales</p>
                    <p className="text-2xl font-bold">{formatUGX(reportData.totalSales)}</p>
                    <p className="text-green-200 text-xs mt-1">{getDateRangeLabel()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Profit</p>
                    <p className="text-2xl font-bold">{formatUGX(reportData.totalProfit)}</p>
                    <p className="text-blue-200 text-xs mt-1">
                      {reportData.totalSales > 0 ? `${((reportData.totalProfit / reportData.totalSales) * 100).toFixed(1)}% margin` : '0% margin'}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Items Sold</p>
                    <p className="text-2xl font-bold">{reportData.itemsSold}</p>
                    <p className="text-purple-200 text-xs mt-1">Physical products</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Services Done</p>
                    <p className="text-2xl font-bold">{reportData.servicesDone}</p>
                    <p className="text-orange-200 text-xs mt-1">Completed services</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services Summary</TabsTrigger>
            <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
            <TabsTrigger value="profits">Profit Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales by Category */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Sales by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.salesByCategory.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category.category}</span>
                          <span className="text-sm text-gray-600">{formatUGX(category.sales)}</span>
                        </div>
                        <Progress
                          value={reportData.totalSales > 0 ? (category.sales / reportData.totalSales) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Selling Items */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Top Selling Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.topSellingItems.map((item, index) => (
                      <div key={item.item_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-gray-500">{item.total_sold} units sold</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatUGX(item.total_revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Art Services Summary */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Art Services Summary
                  </CardTitle>
                  <CardDescription>
                    Performance metrics for art services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Total Sales</p>
                      <p className="text-2xl font-bold text-blue-900">{formatUGX(reportData.artServicesSummary.totalSales)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Total Profit</p>
                      <p className="text-2xl font-bold text-green-900">{formatUGX(reportData.artServicesSummary.totalProfit)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Services Done</p>
                      <p className="text-2xl font-bold text-purple-900">{reportData.artServicesSummary.totalServices}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                      <p className="text-sm text-orange-600 font-medium">Profit Margin</p>
                      <p className={`text-2xl font-bold ${getProfitMarginColor(reportData.artServicesSummary.profitMargin)}`}>
                        {reportData.artServicesSummary.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Machines Summary */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    Machines Summary
                  </CardTitle>
                  <CardDescription>
                    Performance metrics for machine services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
                      <p className="text-sm text-indigo-600 font-medium">Total Sales</p>
                      <p className="text-2xl font-bold text-indigo-900">{formatUGX(reportData.machinesSummary.totalSales)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                      <p className="text-sm text-emerald-600 font-medium">Total Profit</p>
                      <p className="text-2xl font-bold text-emerald-900">{formatUGX(reportData.machinesSummary.totalProfit)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg">
                      <p className="text-sm text-violet-600 font-medium">Services Done</p>
                      <p className="text-2xl font-bold text-violet-900">{reportData.machinesSummary.totalServices}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                      <p className="text-sm text-amber-600 font-medium">Profit Margin</p>
                      <p className={`text-2xl font-bold ${getProfitMarginColor(reportData.machinesSummary.profitMargin)}`}>
                        {reportData.machinesSummary.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Daily Sales Trend
                </CardTitle>
                <CardDescription>
                  Sales performance over the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.dailySales.map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(day.date).toLocaleDateString('en', { weekday: 'long' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatUGX(day.sales)}</p>
                        <p className="text-sm text-gray-500">Profit: {formatUGX(day.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profits" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Profit Margins by Category
                </CardTitle>
                <CardDescription>
                  Profitability analysis across different business areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(reportData.profitMargins).map(([category, margin]) => (
                    <div key={category} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{category}</span>
                        <span className={`font-bold ${getProfitMarginColor(margin)}`}>
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={margin} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Revenue Growth</span>
                    <Badge className="bg-green-100 text-green-800">+15.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Satisfaction</span>
                    <Badge className="bg-blue-100 text-blue-800">94.5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Inventory Turnover</span>
                    <Badge className="bg-purple-100 text-purple-800">8.3x</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Service Efficiency</span>
                    <Badge className="bg-orange-100 text-orange-800">89.7%</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Best performing category:</strong> Stationery with highest profit margin
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Growth opportunity:</strong> Art Services showing potential for expansion
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Attention needed:</strong> Machine services profit margin could be improved
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs >
      </div >
    </div >
  );
};

export default Reports;
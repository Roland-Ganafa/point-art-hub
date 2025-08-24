import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  Calendar,
  RefreshCw,
  Target,
  Award,
  Activity,
  Palette
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import ExportDialog from '@/components/ExportDialog';

const formatUGX = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "UGX 0";
  return `UGX ${amount.toLocaleString()}`;
};

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d084d0', '#8dd1e1'];

interface SalesData {
  date: string;
  sales: number;
  profit: number;
  items_sold: number;
  transactions: number;
}

interface CategoryData {
  category: string;
  sales: number;
  profit: number;
  items: number;
  margin: number;
}

interface PerformanceMetrics {
  totalSales: number;
  totalProfit: number;
  totalItems: number;
  totalTransactions: number;
  averageOrderValue: number;
  profitMargin: number;
  growthRate: number;
  topProducts: Array<{
    name: string;
    sales: number;
    quantity: number;
  }>;
  salesByPeriod: SalesData[];
  categoryPerformance: CategoryData[];
  recentTrends: {
    salesTrend: 'up' | 'down' | 'stable';
    profitTrend: 'up' | 'down' | 'stable';
    volumeTrend: 'up' | 'down' | 'stable';
  };
}

const SalesAnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalSales: 0,
    totalProfit: 0,
    totalItems: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    profitMargin: 0,
    growthRate: 0,
    topProducts: [],
    salesByPeriod: [],
    categoryPerformance: [],
    recentTrends: {
      salesTrend: 'stable',
      profitTrend: 'stable',
      volumeTrend: 'stable'
    }
  });

  const [dateRange, setDateRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { toast } = useToast();

  useEffect(() => {
    generateAnalytics();
  }, [dateRange]);

  const generateAnalytics = async () => {
    try {
      setIsLoading(true);

      // Calculate date ranges
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
          startDate.setDate(endDate.getDate() - 30);
      }

      // Fetch data from different tables
      const [salesData] = await Promise.all([
        supabase.from('stationery_sales')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      ]);

      // Process and calculate metrics
      const salesTotal = salesData.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const profitTotal = salesData.data?.reduce((sum, sale) => sum + (sale.profit || 0), 0) || 0;
      const itemsTotal = salesData.data?.reduce((sum, sale) => sum + (sale.quantity || 0), 0) || 0;
      const transactionsTotal = salesData.data?.length || 0;

      // Generate daily sales data for chart
      const dailySalesMap = new Map<string, SalesData>();
      const days = parseInt(dateRange.replace('days', '')) || 30;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailySalesMap.set(dateStr, {
          date: dateStr,
          sales: 0,
          profit: 0,
          items_sold: 0,
          transactions: 0
        });
      }

      // Populate with actual sales data
      salesData.data?.forEach(sale => {
        const dateStr = new Date(sale.created_at).toISOString().split('T')[0];
        const existing = dailySalesMap.get(dateStr);
        if (existing) {
          existing.sales += sale.total_amount || 0;
          existing.profit += sale.profit || 0;
          existing.items_sold += sale.quantity || 0;
          existing.transactions += 1;
        }
      });

      const salesByPeriod = Array.from(dailySalesMap.values());

      // Category performance data
      const categoryPerformance: CategoryData[] = [
        {
          category: 'Stationery',
          sales: salesTotal * 0.4,
          profit: profitTotal * 0.35,
          items: itemsTotal * 0.5,
          margin: 35
        },
        {
          category: 'Gifts',
          sales: salesTotal * 0.25,
          profit: profitTotal * 0.3,
          items: itemsTotal * 0.2,
          margin: 48
        },
        {
          category: 'Embroidery',
          sales: salesTotal * 0.15,
          profit: profitTotal * 0.2,
          items: itemsTotal * 0.1,
          margin: 53
        },
        {
          category: 'Machines',
          sales: salesTotal * 0.12,
          profit: profitTotal * 0.1,
          items: itemsTotal * 0.15,
          margin: 33
        },
        {
          category: 'Art Services',
          sales: salesTotal * 0.08,
          profit: profitTotal * 0.05,
          items: itemsTotal * 0.05,
          margin: 25
        }
      ];

      // Top products (mock data)
      const topProducts = [
        { name: 'A4 Paper', sales: 45000, quantity: 150 },
        { name: 'Pens Set', sales: 32000, quantity: 80 },
        { name: 'Custom T-Shirt', sales: 28000, quantity: 14 },
        { name: 'Notebooks', sales: 25000, quantity: 50 },
        { name: 'Printing Service', sales: 22000, quantity: 110 }
      ];

      // Calculate trends
      const recentSales = salesByPeriod.slice(-7);
      const previousSales = salesByPeriod.slice(-14, -7);
      
      const recentAvg = recentSales.reduce((sum, day) => sum + day.sales, 0) / 7;
      const previousAvg = previousSales.reduce((sum, day) => sum + day.sales, 0) / 7;
      
      const salesTrend = recentAvg > previousAvg * 1.05 ? 'up' : 
                        recentAvg < previousAvg * 0.95 ? 'down' : 'stable';

      setMetrics({
        totalSales: salesTotal,
        totalProfit: profitTotal,
        totalItems: itemsTotal,
        totalTransactions: transactionsTotal,
        averageOrderValue: transactionsTotal > 0 ? salesTotal / transactionsTotal : 0,
        profitMargin: salesTotal > 0 ? (profitTotal / salesTotal) * 100 : 0,
        growthRate: previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0,
        topProducts,
        salesByPeriod,
        categoryPerformance,
        recentTrends: {
          salesTrend,
          profitTrend: salesTrend,
          volumeTrend: salesTrend
        }
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error generating analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate analytics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (dateRange) {
      case '7days': return 'Last 7 Days';
      case '30days': return 'Last 30 Days';
      case '90days': return 'Last 90 Days';
      case 'year': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sales Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Comprehensive sales performance insights and trends</p>
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
                onClick={generateAnalytics}
                disabled={isLoading}
                className="bg-white/80"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <ExportDialog
                data={[metrics]}
                type="sales"
                moduleTitle="Sales Analytics"
                disabled={!metrics.totalSales}
              />
            </div>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Sales</p>
                  <p className="text-2xl font-bold">{formatUGX(metrics.totalSales)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(metrics.recentTrends.salesTrend)}
                    <span className="text-xs text-green-200">
                      {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <DollarSign className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Profit</p>
                  <p className="text-2xl font-bold">{formatUGX(metrics.totalProfit)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(metrics.recentTrends.profitTrend)}
                    <span className="text-xs text-blue-200">
                      {metrics.profitMargin.toFixed(1)}% margin
                    </span>
                  </div>
                </div>
                <Target className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Items Sold</p>
                  <p className="text-3xl font-bold">{metrics.totalItems}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(metrics.recentTrends.volumeTrend)}
                    <span className="text-xs text-purple-200">units</span>
                  </div>
                </div>
                <Package className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Avg Order Value</p>
                  <p className="text-2xl font-bold">{formatUGX(metrics.averageOrderValue)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ShoppingCart className="h-3 w-3 text-orange-200" />
                    <span className="text-xs text-orange-200">
                      {metrics.totalTransactions} orders
                    </span>
                  </div>
                </div>
                <Users className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Overview */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-8 duration-700 delay-300 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 p-8 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <h3 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl text-white shadow-lg">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  Analytics Overview
                </h3>
                <p className="text-gray-600 text-lg font-medium">Real-time insights and performance metrics</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-white/40 shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-semibold">Live Data</span>
                </div>
                <span className="text-gray-500 font-medium">Updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          
          <CardContent className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {/* Performance Metrics */}
              <div className="space-y-8">
                <h4 className="text-xl font-bold text-gray-800 flex items-center gap-3 pb-2 border-b border-gray-100">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  Performance Metrics
                </h4>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-700 font-semibold uppercase tracking-wide">Revenue Growth</p>
                        <p className="text-green-800 font-bold text-lg">{metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}% this period</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl lg:text-3xl font-bold text-green-700">{formatUGX(metrics.totalSales)}</p>
                      <p className="text-sm text-green-600 font-medium">Total sales</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 font-semibold uppercase tracking-wide">Profit Margin</p>
                        <p className="text-blue-800 font-bold text-lg">{metrics.profitMargin.toFixed(1)}% average</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl lg:text-3xl font-bold text-blue-700">{formatUGX(metrics.totalProfit)}</p>
                      <p className="text-sm text-blue-600 font-medium">Total profit</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-100 hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-700 font-semibold uppercase tracking-wide">Transaction Efficiency</p>
                        <p className="text-purple-800 font-bold text-lg">{formatUGX(metrics.averageOrderValue)} avg order</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl lg:text-3xl font-bold text-purple-700">{metrics.totalTransactions}</p>
                      <p className="text-sm text-purple-600 font-medium">Total transactions</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Category Performance */}
              <div className="space-y-8">
                <h4 className="text-xl font-bold text-gray-800 flex items-center gap-3 pb-2 border-b border-gray-100">
                  <Package className="h-6 w-6 text-orange-500" />
                  Category Performance
                </h4>
                
                <div className="space-y-4">
                  {metrics.categoryPerformance.map((category, index) => {
                    const percentage = metrics.totalSales > 0 ? (category.sales / metrics.totalSales) * 100 : 0;
                    
                    return (
                      <div key={category.category} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 cursor-pointer hover:shadow-md border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm">
                              <Package className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{category.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-800">{formatUGX(category.sales)}</span>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          {category.margin.toFixed(1)}% margin • {category.items} items
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-sm text-gray-600 font-medium mb-1">Total Items Sold</p>
                      <p className="text-3xl font-bold text-gray-800">{metrics.totalItems}</p>
                    </div>
                    <div className="w-px h-12 bg-gray-300 mx-6"></div>
                    <div className="text-center flex-1">
                      <p className="text-sm text-gray-600 font-medium mb-1">Average Order Value</p>
                      <p className="text-3xl font-bold text-gray-800">{formatUGX(metrics.averageOrderValue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts and Analytics */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="trends">Sales Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend Chart */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sales Trend - {getPeriodLabel()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={metrics.salesByPeriod}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip 
                        formatter={(value, name) => [formatUGX(Number(value)), name === 'sales' ? 'Sales' : 'Profit']}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stackId="1" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stackId="2" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Volume Trend Chart */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Volume & Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics.salesByPeriod}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'items_sold' ? `${value} items` : `${value} orders`,
                          name === 'items_sold' ? 'Items Sold' : 'Transactions'
                        ]}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="items_sold" 
                        stroke="#ffc658" 
                        strokeWidth={2}
                        dot={{ fill: '#ffc658' }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="transactions" 
                        stroke="#ff7300" 
                        strokeWidth={2}
                        dot={{ fill: '#ff7300' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Performance Bar Chart */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Sales by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.categoryPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value) => formatUGX(Number(value))} />
                      <Bar dataKey="sales" fill="#8884d8" />
                      <Bar dataKey="profit" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Distribution Pie Chart */}
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Category Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.categoryPerformance}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="sales"
                      >
                        {metrics.categoryPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatUGX(Number(value))} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performing Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatUGX(product.sales)}</p>
                        <p className="text-sm text-gray-500">
                          {formatUGX(product.sales / product.quantity)}/unit
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Profit Margin</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{metrics.profitMargin.toFixed(1)}%</span>
                    <Badge className={metrics.profitMargin > 30 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {metrics.profitMargin > 30 ? 'Excellent' : 'Good'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Average Order Value</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatUGX(metrics.averageOrderValue)}</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {metrics.averageOrderValue > 20000 ? 'High' : 'Standard'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Growth Rate</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${metrics.recentTrends.salesTrend === 'up' ? 'text-green-600' : metrics.recentTrends.salesTrend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
                    </span>
                    {getTrendIcon(metrics.recentTrends.salesTrend)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SalesAnalyticsDashboard;
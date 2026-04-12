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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
    totalExpenditure: number;
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
      totalExpenditure: 0,
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
      endDate.setHours(23, 59, 59, 999);
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
      startDate.setHours(0, 0, 0, 0);

      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      const startDateOnly = startDateStr.split('T')[0];
      const endDateOnly = endDateStr.split('T')[0];

      // Fetch data from all tables with date filters applied consistently
      const [
        stationeryData,
        giftData,
        embroideryData,
        machinesData,
        artServicesData,
        salesData,
        stationeryDailySalesData,
        giftDailySalesData
      ] = await Promise.all([
        supabase.from('stationery').select('*'),
        supabase.from('gift_store').select('*'),
        supabase.from('embroidery').select('*').gte('date', startDateOnly).lte('date', endDateOnly),
        supabase.from('machines').select('*').gte('date', startDateOnly).lte('date', endDateOnly),
        supabase.from('art_services').select('*').gte('date', startDateOnly).lte('date', endDateOnly),
        supabase.from('stationery_sales')
          .select('*')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr),
        supabase.from('stationery_daily_sales')
          .select('item, quantity, selling_price, rate, date')
          .gte('date', startDateStr)
          .lte('date', endDateStr),
        supabase.from('gift_daily_sales')
          .select('item, quantity, spx, bpx, date')
          .gte('date', startDateOnly)
          .lte('date', endDateOnly)
      ]);

      // Calculate totals
      let totalSales = 0;
      let totalProfit = 0;
      let totalExpenses = 0;
      let itemsSold = 0;
      let servicesDone = 0;

      // Process stationery_sales data
      if (salesData.data) {
        totalSales += salesData.data.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        totalProfit += salesData.data.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        itemsSold += salesData.data.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
      }

      // Process gift daily sales
      const giftRows = giftDailySalesData.data || [];
      totalSales += giftRows.reduce((sum, s) => sum + Number(s.spx || 0) * Number(s.quantity || 0), 0);
      totalProfit += giftRows.reduce((sum, s) => sum + (Number(s.spx || 0) - Number(s.bpx || 0)) * Number(s.quantity || 0), 0);
      itemsSold += giftRows.reduce((sum, s) => sum + Number(s.quantity || 0), 0);

      // Process service data
      const allServices = [
        ...(embroideryData.data || []),
        ...(machinesData.data || []),
        ...(artServicesData.data || [])
      ];

      servicesDone = allServices.length;
      totalSales += allServices.reduce((sum, service) => sum + (service.sales || 0), 0);

      if (embroideryData.data) {
        totalProfit += embroideryData.data.reduce((sum, service) => sum + (service.profit || 0), 0);
      }
      if (artServicesData.data) {
        totalProfit += artServicesData.data.reduce((sum, service) => sum + (service.profit || 0), 0);
      }
      if (machinesData.data) {
        totalProfit += machinesData.data.reduce((sum, service) => {
          const profit = (service.sales || 0) - (service.expenditure || 0);
          return sum + Math.max(0, profit);
        }, 0);
      }

      totalExpenses += allServices.reduce((sum, service) => sum + (service.expenditure || 0), 0);

      // ── Real: top selling items ────────────────────────────────────────────
      const itemMap: Record<string, { total_sold: number; total_revenue: number }> = {};
      const addItem = (name: string, qty: number, revenue: number) => {
        if (!name) return;
        if (!itemMap[name]) itemMap[name] = { total_sold: 0, total_revenue: 0 };
        itemMap[name].total_sold += qty;
        itemMap[name].total_revenue += revenue;
      };

      (stationeryDailySalesData.data || []).forEach(s => {
        addItem(s.item, Number(s.quantity || 0), Number(s.selling_price || 0) * Number(s.quantity || 0));
      });

      giftRows.forEach(s => {
        const name = s.item?.includes(': ') ? s.item.split(': ').slice(1).join(': ') : s.item;
        addItem(name, Number(s.quantity || 0), Number(s.spx || 0) * Number(s.quantity || 0));
      });

      (artServicesData.data || []).forEach(s => {
        addItem(s.service_name || 'Art Service', Number(s.quantity || 0), Number(s.sales || 0));
      });

      (machinesData.data || []).forEach(s => {
        addItem(s.service_description || s.machine_name || 'Machine Service', Number(s.quantity || 0), Number(s.sales || 0));
      });

      (embroideryData.data || []).forEach(s => {
        addItem(s.job_description || 'Embroidery', 1, Number(s.sales || s.quotation || 0));
      });

      const topSellingItems = Object.entries(itemMap)
        .map(([item_name, stats]) => ({ item_name, ...stats }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      // ── Real: sales by category ────────────────────────────────────────────
      const statRows = stationeryDailySalesData.data || [];
      const stationerySales = statRows.reduce((sum, s) => sum + Number(s.selling_price || 0) * Number(s.quantity || 0), 0)
        + (salesData.data || []).reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
      const stationeryProfit = statRows.reduce((sum, s) => sum + (Number(s.selling_price || 0) - Number(s.rate || 0)) * Number(s.quantity || 0), 0)
        + (salesData.data || []).reduce((sum, s) => sum + Number(s.profit || 0), 0);

      const giftSales = giftRows.reduce((sum, s) => sum + Number(s.spx || 0) * Number(s.quantity || 0), 0);
      const giftProfit = giftRows.reduce((sum, s) => sum + (Number(s.spx || 0) - Number(s.bpx || 0)) * Number(s.quantity || 0), 0);

      const embSales = (embroideryData.data || []).reduce((sum, s) => sum + Number(s.sales || s.quotation || 0), 0);
      const embProfit = (embroideryData.data || []).reduce((sum, s) => sum + Number(s.profit || 0), 0);

      const macSales = (machinesData.data || []).reduce((sum, s) => sum + Number(s.sales || 0), 0);
      const macProfit = (machinesData.data || []).reduce((sum, s) => sum + Math.max(0, Number(s.sales || 0) - Number(s.expenditure || 0)), 0);

      const artSales = (artServicesData.data || []).reduce((sum, s) => sum + Number(s.sales || 0), 0);
      const artProfit = (artServicesData.data || []).reduce((sum, s) => sum + Number(s.profit || 0), 0);

      const salesByCategory = [
        { category: 'Stationery', sales: stationerySales, profit: stationeryProfit },
        { category: 'Gifts', sales: giftSales, profit: giftProfit },
        { category: 'Embroidery', sales: embSales, profit: embProfit },
        { category: 'Machines', sales: macSales, profit: macProfit },
        { category: 'Art Services', sales: artSales, profit: artProfit },
      ].filter(c => c.sales > 0 || c.profit > 0);

      // ── Real: daily sales aggregated from all sources ──────────────────────
      const dailyMap: Record<string, { sales: number; profit: number }> = {};
      const addToDay = (rawDate: string, sales: number, profit: number) => {
        const day = rawDate?.split('T')[0];
        if (!day) return;
        if (!dailyMap[day]) dailyMap[day] = { sales: 0, profit: 0 };
        dailyMap[day].sales += sales;
        dailyMap[day].profit += profit;
      };

      statRows.forEach(s => addToDay(s.date, Number(s.selling_price || 0) * Number(s.quantity || 0), (Number(s.selling_price || 0) - Number(s.rate || 0)) * Number(s.quantity || 0)));
      giftRows.forEach(s => addToDay(s.date, Number(s.spx || 0) * Number(s.quantity || 0), (Number(s.spx || 0) - Number(s.bpx || 0)) * Number(s.quantity || 0)));
      (embroideryData.data || []).forEach(s => addToDay(s.date, Number(s.sales || s.quotation || 0), Number(s.profit || 0)));
      (machinesData.data || []).forEach(s => addToDay(s.date, Number(s.sales || 0), Math.max(0, Number(s.sales || 0) - Number(s.expenditure || 0))));
      (artServicesData.data || []).forEach(s => addToDay(s.date, Number(s.sales || 0), Number(s.profit || 0)));
      (salesData.data || []).forEach(s => addToDay(s.created_at || s.date, Number(s.total_amount || 0), Number(s.profit || 0)));

      const dailySales = Object.entries(dailyMap)
        .map(([date, { sales, profit }]) => ({ date, sales, profit }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // ── Real: profit margins per category ─────────────────────────────────
      const profitMargins = {
        stationery: stationerySales > 0 ? (stationeryProfit / stationerySales) * 100 : 0,
        gifts: giftSales > 0 ? (giftProfit / giftSales) * 100 : 0,
        embroidery: embSales > 0 ? (embProfit / embSales) * 100 : 0,
        machines: macSales > 0 ? (macProfit / macSales) * 100 : 0,
        artServices: artSales > 0 ? (artProfit / artSales) * 100 : 0,
      };

      // Calculate Art Services Summary
      const artServicesSales = (artServicesData.data || []).reduce((sum, service) => sum + (service.sales || 0), 0);
      const artServicesExpenditure = (artServicesData.data || []).reduce((sum, service) => sum + (service.expenditure || 0), 0);
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
          totalExpenditure: artServicesExpenditure,
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

    if (format === 'pdf') {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('en-GB');

      // Header
      doc.setFillColor(234, 88, 12);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Point Art Hub — Sales Report', 14, 12);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${dateRange} | Generated: ${today}`, 14, 22);

      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 38);

      autoTable(doc, {
        startY: 42,
        head: [['Metric', 'Value']],
        body: [
          ['Total Sales', formatUGX(reportData.totalSales)],
          ['Total Profit', formatUGX(reportData.totalProfit)],
          ['Total Expenses', formatUGX(reportData.totalExpenses)],
          ['Items Sold', reportData.itemsSold.toString()],
          ['Services Done', reportData.servicesDone.toString()],
        ],
        headStyles: { fillColor: [234, 88, 12] },
        alternateRowStyles: { fillColor: [255, 247, 237] },
        styles: { fontSize: 10 },
      });

      // Top Selling Items
      const afterSummary = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Selling Items', 14, afterSummary);

      autoTable(doc, {
        startY: afterSummary + 4,
        head: [['Item Name', 'Qty Sold', 'Revenue (UGX)']],
        body: reportData.topSellingItems.map(item => [
          item.item_name,
          item.total_sold.toString(),
          formatUGX(item.total_revenue),
        ]),
        headStyles: { fillColor: [124, 58, 237] },
        alternateRowStyles: { fillColor: [245, 243, 255] },
        styles: { fontSize: 10 },
      });

      // Sales by Category
      const afterItems = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Sales by Category', 14, afterItems);

      autoTable(doc, {
        startY: afterItems + 4,
        head: [['Category', 'Sales (UGX)', 'Profit (UGX)']],
        body: reportData.salesByCategory.map(cat => [
          cat.category,
          formatUGX(cat.sales),
          formatUGX(cat.profit),
        ]),
        headStyles: { fillColor: [5, 150, 105] },
        alternateRowStyles: { fillColor: [236, 253, 245] },
        styles: { fontSize: 10 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Point Art Hub | Page ${i} of ${pageCount}`, 14, 290);
      }

      doc.save(`point-art-hub-report-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`);
    }

    toast({
      title: 'Export Complete',
      description: `Report exported successfully as ${format.toUpperCase()}`,
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 dark:from-indigo-950/30 via-purple-50 to-pink-50 dark:to-pink-950/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Comprehensive business insights and performance metrics</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                className="bg-white/80 dark:bg-gray-900/80"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => exportReport('csv')}
                    className="bg-white/80 dark:bg-gray-900/80"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportReport('pdf')}
                    className="bg-white/80 dark:bg-gray-900/80"
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
          <TabsList className="grid w-full grid-cols-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services Summary</TabsTrigger>
            <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
            <TabsTrigger value="profits">Profit Analysis</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales by Category */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
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
                          <span className="text-sm text-gray-600 dark:text-gray-400">{formatUGX(category.sales)}</span>
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
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Top Selling Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.topSellingItems.map((item, index) => (
                      <div key={item.item_name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.item_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.total_sold} units sold</p>
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
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
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
                    <div className="p-4 bg-gradient-to-br from-blue-50 dark:from-blue-950/30 to-blue-100 dark:to-blue-900/30 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Total Sales</p>
                      <p className="text-2xl font-bold text-blue-900">{formatUGX(reportData.artServicesSummary.totalSales)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-50 dark:from-red-950/30 to-red-100 dark:to-red-900/30 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">Total Expenditure</p>
                      <p className="text-2xl font-bold text-red-900">{formatUGX(reportData.artServicesSummary.totalExpenditure)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-green-50 dark:from-green-950/30 to-green-100 dark:to-green-900/30 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Total Profit</p>
                      <p className="text-2xl font-bold text-green-900">{formatUGX(reportData.artServicesSummary.totalProfit)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 dark:from-purple-950/30 to-purple-100 dark:to-purple-900/30 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">Services Done</p>
                      <p className="text-2xl font-bold text-purple-900">{reportData.artServicesSummary.totalServices}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-50 dark:from-orange-950/30 to-orange-100 dark:to-orange-900/30 rounded-lg col-span-2">
                      <p className="text-sm text-orange-600 font-medium">Profit Margin</p>
                      <p className={`text-2xl font-bold ${getProfitMarginColor(reportData.artServicesSummary.profitMargin)}`}>
                        {reportData.artServicesSummary.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Machines Summary */}
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
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
                    <div className="p-4 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/30 to-indigo-100 dark:to-indigo-900/30 rounded-lg">
                      <p className="text-sm text-indigo-600 font-medium">Total Sales</p>
                      <p className="text-2xl font-bold text-indigo-900">{formatUGX(reportData.machinesSummary.totalSales)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:to-emerald-900/30 rounded-lg">
                      <p className="text-sm text-emerald-600 font-medium">Total Profit</p>
                      <p className="text-2xl font-bold text-emerald-900">{formatUGX(reportData.machinesSummary.totalProfit)}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 dark:to-violet-900/30 rounded-lg">
                      <p className="text-sm text-violet-600 font-medium">Services Done</p>
                      <p className="text-2xl font-bold text-violet-900">{reportData.machinesSummary.totalServices}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-50 dark:from-amber-950/30 to-amber-100 dark:to-amber-900/30 rounded-lg">
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
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
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
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(day.date).toLocaleDateString('en', { weekday: 'long' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatUGX(day.sales)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Profit: {formatUGX(day.profit)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profits" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
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
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Revenue Growth</span>
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800">+15.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Satisfaction</span>
                    <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-800">94.5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Inventory Turnover</span>
                    <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800">8.3x</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Service Efficiency</span>
                    <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800">89.7%</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Best performing category:</strong> Stationery with highest profit margin
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Growth opportunity:</strong> Art Services showing potential for expansion
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
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
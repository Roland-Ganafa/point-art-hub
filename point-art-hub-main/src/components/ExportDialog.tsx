import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Calendar, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { exportData } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';

interface ExportDialogProps {
  data: any[];
  type: 'stationery' | 'gift_store' | 'embroidery' | 'machines' | 'art_services' | 'sales' | 'customers' | 'invoices';
  moduleTitle: string;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  data,
  type,
  moduleTitle,
  trigger,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [customFilename, setCustomFilename] = useState('');

  const { toast } = useToast();
  const { isAdmin } = useUser();

  const handleExport = async () => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can export data',
        variant: 'destructive',
      });
      return;
    }

    if (data.length === 0) {
      toast({
        title: 'No Data',
        description: 'There is no data to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExporting(true);

      const exportOptions: any = {
        includeTimestamp,
        filename: customFilename || undefined,
      };

      // Add date range if specified
      if (startDate && endDate) {
        exportOptions.dateRange = {
          start: new Date(startDate),
          end: new Date(endDate + 'T23:59:59'), // Include end of day
        };
      } else if (startDate) {
        exportOptions.dateRange = {
          start: new Date(startDate),
          end: new Date(),
        };
      } else if (endDate) {
        exportOptions.dateRange = {
          start: new Date('2020-01-01'), // Start from a reasonable past date
          end: new Date(endDate + 'T23:59:59'),
        };
      }

      await exportData(data, type, exportOptions);

      const recordCount = exportOptions.dateRange ? 
        data.filter(item => {
          const dateField = type === 'sales' ? 'sale_date' : 'created_at';
          const itemDate = new Date(item[dateField]);
          return (!exportOptions.dateRange.start || itemDate >= exportOptions.dateRange.start) &&
                 (!exportOptions.dateRange.end || itemDate <= exportOptions.dateRange.end);
        }).length : data.length;

      toast({
        title: 'Export Successful',
        description: `Successfully exported ${recordCount} ${moduleTitle.toLowerCase()} records to CSV`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCustomFilename('');
    setIncludeTimestamp(true);
  };

  const getDateFieldLabel = () => {
    switch (type) {
      case 'sales': return 'Sale Date';
      case 'embroidery':
      case 'machines':
      case 'art_services': return 'Service Date';
      default: return 'Creation Date';
    }
  };

  const defaultTrigger = (
    <Button 
      variant="outline" 
      disabled={disabled || !isAdmin}
      className="bg-white/80 hover:bg-green-50 border-green-200"
    >
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export {moduleTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!isAdmin && (
            <Alert>
              <AlertDescription>
                Only administrators can export data.
              </AlertDescription>
            </Alert>
          )}

          {data.length === 0 && (
            <Alert>
              <AlertDescription>
                No data available to export.
              </AlertDescription>
            </Alert>
          )}

          {isAdmin && data.length > 0 && (
            <>
              {/* Date Range Filter */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Label className="text-sm font-medium">Date Range Filter</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="start-date" className="text-xs text-gray-600">
                      From ({getDateFieldLabel()})
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs text-gray-600">
                      To ({getDateFieldLabel()})
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                {(startDate || endDate) && (
                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    <Filter className="h-3 w-3 inline mr-1" />
                    {startDate && endDate ? 
                      `Filtering records from ${format(new Date(startDate), 'MMM dd, yyyy')} to ${format(new Date(endDate), 'MMM dd, yyyy')}` :
                      startDate ?
                      `Filtering records from ${format(new Date(startDate), 'MMM dd, yyyy')} onwards` :
                      `Filtering records up to ${format(new Date(endDate), 'MMM dd, yyyy')}`
                    }
                  </div>
                )}
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Export Options</Label>
                
                <div>
                  <Label htmlFor="filename" className="text-xs text-gray-600">
                    Custom Filename (optional)
                  </Label>
                  <Input
                    id="filename"
                    value={customFilename}
                    onChange={(e) => setCustomFilename(e.target.value)}
                    placeholder={`${type.replace('_', '-')}-export`}
                    className="text-sm mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for auto-generated filename
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="timestamp"
                    checked={includeTimestamp}
                    onCheckedChange={(checked) => setIncludeTimestamp(checked === true)}
                  />
                  <Label htmlFor="timestamp" className="text-sm">
                    Include timestamp in filename
                  </Label>
                </div>
              </div>

              {/* Export Summary */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Records:</span>
                    <span className="font-medium">{data.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Export Format:</span>
                    <span className="font-medium">CSV</span>
                  </div>
                  {(startDate || endDate) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date Filtered:</span>
                      <span className="font-medium">Yes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="flex-1"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
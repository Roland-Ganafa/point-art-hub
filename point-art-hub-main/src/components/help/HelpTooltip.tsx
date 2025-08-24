import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { HelpCircle, Info, Lightbulb, AlertCircle } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
  title?: string;
  type?: 'info' | 'tip' | 'warning' | 'help';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  showIcon?: boolean;
  maxWidth?: number;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  type = 'help',
  placement = 'top',
  children,
  showIcon = true,
  maxWidth = 300
}) => {
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'tip':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'help':
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500 hover:text-blue-500 transition-colors" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'tip':
        return 'bg-yellow-50 border-yellow-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'help':
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 hover:bg-transparent"
            >
              {showIcon && getIcon()}
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent
          side={placement}
          className={`${getBackgroundColor()} border shadow-lg p-3 max-w-sm`}
          style={{ maxWidth: `${maxWidth}px` }}
        >
          {title && (
            <div className="font-semibold text-sm mb-1 flex items-center gap-2">
              {getIcon()}
              {title}
            </div>
          )}
          <div className="text-sm text-gray-700">
            {content}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Pre-defined tooltips for common UI elements
export const tooltips = {
  // Dashboard tooltips
  dashboard: {
    totalValue: "Total value of all inventory items based on current stock and prices",
    lowStock: "Items that have fallen below their minimum stock level",
    recentSales: "Sales transactions from the last 24 hours",
    quickActions: "Common tasks and shortcuts for faster workflow"
  },

  // Inventory tooltips
  inventory: {
    addItem: "Add a new item to your inventory. All fields marked with * are required",
    editItem: "Modify existing item details. Changes are saved automatically",
    deleteItem: "Permanently remove this item from inventory. This action cannot be undone",
    stockLevel: "Current quantity in stock. Update this when you receive new stock",
    minStock: "Alert threshold - you'll be notified when stock falls below this level",
    category: "Group similar items together for better organization and reporting",
    cost: "Your purchase price for this item (used for profit calculations)",
    price: "Selling price for customers (used for sales transactions)"
  },

  // Sales tooltips
  sales: {
    recordSale: "Record a new sale transaction. Stock levels will be automatically updated",
    quantity: "Number of items being sold. Must not exceed available stock",
    discount: "Percentage or fixed amount discount applied to this sale",
    paymentMethod: "How the customer is paying (affects reporting and tracking)",
    salesPerson: "Initial of person making the sale (for performance tracking)",
    customer: "Link this sale to a customer record for better insights"
  },

  // Reports tooltips
  reports: {
    dateRange: "Select the time period for your report. Affects all calculations and charts",
    exportData: "Download this report as CSV or Excel file for further analysis",
    profit: "Revenue minus cost of goods sold. Excludes operational expenses",
    revenue: "Total sales amount before any deductions",
    margin: "Profit as a percentage of revenue (Profit ÷ Revenue × 100)",
    trend: "Comparison with previous period to show growth or decline"
  },

  // Settings tooltips
  settings: {
    notifications: "Configure when and how you receive alerts and updates",
    backup: "Create copies of your data for safety and disaster recovery",
    users: "Manage who can access the system and what they can do",
    currency: "Display format for monetary values throughout the system",
    timezone: "Used for timestamps and scheduled reports",
    language: "Interface language (affects menus, buttons, and messages)"
  },

  // Customer management tooltips
  customers: {
    addCustomer: "Create a new customer record with contact and preference information",
    creditLimit: "Maximum amount this customer can owe before payment is required",
    customerType: "Categorize customers (retail, wholesale, etc.) for targeted pricing",
    purchaseHistory: "Complete record of all transactions with this customer",
    outstandingBalance: "Amount customer owes for credit purchases",
    marketingConsent: "Whether customer has agreed to receive promotional communications"
  },

  // Invoice tooltips
  invoices: {
    createInvoice: "Generate a professional invoice for goods or services",
    paymentTerms: "When payment is due (e.g., Net 30 means payment due in 30 days)",
    taxRate: "Percentage added to subtotal (configured in Settings)",
    itemDiscount: "Reduction applied to individual line items",
    invoiceDiscount: "Reduction applied to entire invoice total",
    status: "Current state: Draft, Sent, Paid, Overdue, or Cancelled"
  }
};

// Helper component for common form field help
interface FieldHelpProps {
  field: string;
  module: keyof typeof tooltips;
}

export const FieldHelp: React.FC<FieldHelpProps> = ({ field, module }) => {
  const content = tooltips[module]?.[field as keyof typeof tooltips[typeof module]];
  
  if (!content) return null;
  
  return (
    <HelpTooltip
      content={content}
      placement="right"
      showIcon={true}
    />
  );
};

// Quick help component for page headers
interface QuickHelpProps {
  title: string;
  description: string;
  tips?: string[];
}

export const QuickHelp: React.FC<QuickHelpProps> = ({ title, description, tips = [] }) => {
  return (
    <HelpTooltip
      title={title}
      content={description}
      type="info"
      maxWidth={400}
    >
      <Button variant="outline" size="sm" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
        <HelpCircle className="h-4 w-4 mr-2" />
        Quick Help
      </Button>
    </HelpTooltip>
  );
};

export default HelpTooltip;
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Book, 
  Search, 
  Play, 
  FileText, 
  HelpCircle, 
  Video, 
  Download,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  Users,
  Settings,
  BarChart3,
  Package,
  ShoppingCart,
  Archive,
  Bell,
  Shield
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  lastUpdated: string;
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  category: string;
  url: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  popularity: number;
}

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sample help articles
  const helpArticles: HelpArticle[] = [
    {
      id: '1',
      title: 'Getting Started with Point Art Hub',
      category: 'basics',
      content: `
# Getting Started with Point Art Hub

Welcome to Point Art Hub! This guide will help you get up and running quickly.

## First Steps
1. **Login**: Use your email and password to access the system
2. **Dashboard**: Familiarize yourself with the main dashboard
3. **Modules**: Explore the different inventory modules

## Key Features
- **Inventory Management**: Track stationery, gifts, and services
- **Sales Recording**: Record and monitor all sales transactions
- **Customer Management**: Maintain customer database
- **Reports & Analytics**: Generate business insights

## Navigation
- Use the top navigation bar to access different sections
- The dashboard provides an overview of your business
- Each module has its own dedicated interface

## Getting Help
- Use the help icon (?) for context-sensitive help
- Check the FAQ section for common questions
- Contact support for technical assistance
      `,
      tags: ['beginner', 'overview', 'dashboard'],
      difficulty: 'beginner',
      estimatedTime: '5 minutes',
      lastUpdated: '2024-01-15'
    },
    {
      id: '2',
      title: 'Managing Inventory Items',
      category: 'inventory',
      content: `
# Managing Inventory Items

Learn how to effectively manage your inventory across all modules.

## Adding New Items
1. Navigate to the desired module (Stationery, Gift Store, etc.)
2. Click the "Add New Item" button
3. Fill in all required fields:
   - Item name
   - Category
   - Price and cost
   - Stock quantity
   - Minimum stock level

## Editing Items
- Click the edit button (pencil icon) next to any item
- Modify the necessary fields
- Save your changes

## Stock Management
- Monitor stock levels through the dashboard
- Set appropriate minimum stock levels
- Receive notifications when items are running low

## Best Practices
- Regular stock audits
- Accurate pricing information
- Proper categorization
- Consistent naming conventions
      `,
      tags: ['inventory', 'items', 'stock'],
      difficulty: 'beginner',
      estimatedTime: '8 minutes',
      lastUpdated: '2024-01-14'
    },
    {
      id: '3',
      title: 'Recording Sales Transactions',
      category: 'sales',
      content: `
# Recording Sales Transactions

Master the art of recording sales efficiently and accurately.

## Creating a Sale
1. Go to the relevant module
2. Click "Record New Sale"
3. Select the item being sold
4. Enter quantity and any discounts
5. Choose payment method
6. Add customer information (optional)
7. Confirm the sale

## Payment Methods
- Cash
- Mobile Money
- Bank Transfer
- Credit/Debit Card

## Sales Tracking
- View sales history in the Reports section
- Monitor daily, weekly, and monthly performance
- Track individual salesperson performance

## Tips for Accuracy
- Double-check quantities and prices
- Verify customer information
- Use proper sales initials for tracking
- Process returns and exchanges properly
      `,
      tags: ['sales', 'transactions', 'payments'],
      difficulty: 'intermediate',
      estimatedTime: '10 minutes',
      lastUpdated: '2024-01-13'
    },
    {
      id: '4',
      title: 'Using Reports and Analytics',
      category: 'reports',
      content: `
# Using Reports and Analytics

Unlock valuable business insights with comprehensive reporting.

## Available Reports
- **Sales Reports**: Track revenue and performance
- **Inventory Reports**: Monitor stock levels and movements
- **Customer Reports**: Analyze customer behavior
- **Profit Analysis**: Calculate margins and profitability

## Analytics Dashboard
- Real-time performance metrics
- Interactive charts and graphs
- Trend analysis
- Comparative data

## Exporting Data
- Export reports to CSV or Excel
- Schedule automated reports
- Share insights with stakeholders

## Key Metrics to Monitor
- Daily/Weekly/Monthly sales
- Inventory turnover
- Customer acquisition and retention
- Profit margins by category
      `,
      tags: ['reports', 'analytics', 'data'],
      difficulty: 'intermediate',
      estimatedTime: '12 minutes',
      lastUpdated: '2024-01-12'
    },
    {
      id: '5',
      title: 'Admin Features and User Management',
      category: 'admin',
      content: `
# Admin Features and User Management

Advanced features for system administrators.

## User Management
- Create and manage user accounts
- Assign roles and permissions
- Monitor user activity
- Reset passwords when needed

## System Configuration
- Configure business settings
- Set up notification preferences
- Manage backup schedules
- Customize system behavior

## Security Features
- Role-based access control
- Audit trails
- Data backup and restore
- User session management

## Admin Responsibilities
- Regular system maintenance
- User training and support
- Data integrity monitoring
- Security best practices
      `,
      tags: ['admin', 'users', 'security'],
      difficulty: 'advanced',
      estimatedTime: '15 minutes',
      lastUpdated: '2024-01-11'
    }
  ];

  // Sample video tutorials
  const videoTutorials: VideoTutorial[] = [
    {
      id: '1',
      title: 'Point Art Hub Overview',
      description: 'A comprehensive overview of all features and capabilities',
      duration: '8:30',
      thumbnail: '/api/placeholder/300/200',
      category: 'basics',
      url: '#'
    },
    {
      id: '2',
      title: 'Inventory Management Walkthrough',
      description: 'Step-by-step guide to managing your inventory effectively',
      duration: '12:15',
      thumbnail: '/api/placeholder/300/200',
      category: 'inventory',
      url: '#'
    },
    {
      id: '3',
      title: 'Sales Processing Demo',
      description: 'Learn how to process sales transactions quickly and accurately',
      duration: '6:45',
      thumbnail: '/api/placeholder/300/200',
      category: 'sales',
      url: '#'
    }
  ];

  // Sample FAQs
  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking the "Forgot Password" link on the login page. Enter your email address and follow the instructions sent to your email.',
      category: 'account',
      popularity: 95
    },
    {
      id: '2',
      question: 'Can I export my data?',
      answer: 'Yes! You can export data from any module using the Export button. Choose between CSV and Excel formats. Admin users can also create full system backups.',
      category: 'data',
      popularity: 88
    },
    {
      id: '3',
      question: 'How do I track sales by person?',
      answer: 'Each sale can be tagged with sales initials. Set up initials in your profile, then select them when recording sales. View performance reports in the Analytics section.',
      category: 'sales',
      popularity: 82
    },
    {
      id: '4',
      question: 'What happens when stock runs low?',
      answer: 'The system automatically tracks stock levels and sends notifications when items fall below the minimum threshold. You can configure these alerts in Settings.',
      category: 'inventory',
      popularity: 76
    },
    {
      id: '5',
      question: 'How do I add a new user?',
      answer: 'Only admin users can add new users. Go to Admin Panel > User Management, click "Add User", and fill in the required information. Assign appropriate roles and permissions.',
      category: 'admin',
      popularity: 71
    }
  ];

  const categories = [
    { id: 'all', label: 'All Topics', icon: Book },
    { id: 'basics', label: 'Getting Started', icon: Play },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'admin', label: 'Admin', icon: Shield },
    { id: 'account', label: 'Account', icon: Users },
    { id: 'data', label: 'Data Management', icon: Archive }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-2xl flex items-center justify-center">
            <HelpCircle className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Help Center
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Find answers, learn features, and get the most out of Point Art Hub
            </p>
          </div>
        </div>

        {/* Search and Categories */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search help articles, FAQs, and guides..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                  <Video className="h-4 w-4 mr-2" />
                  Video Tutorials
                </Button>
                <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                  <Download className="h-4 w-4 mr-2" />
                  Download Guides
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`h-auto p-3 flex flex-col items-center gap-2 ${
                      selectedCategory === category.id 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{category.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl rounded-xl p-2">
            <TabsTrigger value="articles" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Video className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="guides" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Book className="h-4 w-4 mr-2" />
              Guides
            </TabsTrigger>
          </TabsList>

          {/* Help Articles */}
          <TabsContent value="articles" className="space-y-6">
            <div className="grid gap-6">
              {filteredArticles.length === 0 ? (
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No articles found</h3>
                    <p className="text-gray-500">Try adjusting your search terms or category filter.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredArticles.map((article) => (
                  <Card key={article.id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            <div className="flex items-center gap-3 text-sm">
                              <Badge variant="outline" className={getDifficultyColor(article.difficulty)}>
                                {article.difficulty}
                              </Badge>
                              <span className="text-gray-500">
                                <Lightbulb className="h-3 w-3 inline mr-1" />
                                {article.estimatedTime}
                              </span>
                              <span className="text-gray-500">
                                Updated {article.lastUpdated}
                              </span>
                            </div>
                          </CardDescription>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <div className="text-gray-600 line-clamp-3">
                          {article.content.split('\n').slice(2, 5).join(' ').substring(0, 200)}...
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex gap-2">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                          Read More
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Video Tutorials */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTutorials.map((video) => (
                <Card key={video.id} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                      <Play className="h-12 w-12 text-blue-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                      {video.duration}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {video.description}
                    </p>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      <Play className="h-4 w-4 mr-2" />
                      Watch Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Quick answers to common questions about Point Art Hub
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFAQs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-left hover:text-blue-600">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Start Guides */}
          <TabsContent value="guides" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500 text-white rounded-lg">
                      <Package className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">Inventory Quick Start</h3>
                  </div>
                  <p className="text-green-700 mb-4">
                    Get your inventory up and running in 5 minutes with this essential guide.
                  </p>
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-200">
                    Start Guide
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500 text-white rounded-lg">
                      <ShoppingCart className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800">Sales Processing</h3>
                  </div>
                  <p className="text-blue-700 mb-4">
                    Learn to process sales efficiently and track performance metrics.
                  </p>
                  <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-200">
                    Start Guide
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500 text-white rounded-lg">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-purple-800">Reports & Analytics</h3>
                  </div>
                  <p className="text-purple-700 mb-4">
                    Master reporting tools to gain valuable business insights.
                  </p>
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-200">
                    Start Guide
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500 text-white rounded-lg">
                      <Settings className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-orange-800">System Setup</h3>
                  </div>
                  <p className="text-orange-700 mb-4">
                    Configure your system settings for optimal performance.
                  </p>
                  <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-200">
                    Start Guide
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Support */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Still Need Help?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Our support team is here to help you succeed. Get personalized assistance with any questions or issues.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Book className="h-4 w-4 mr-2" />
                Schedule Training
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpCenter;
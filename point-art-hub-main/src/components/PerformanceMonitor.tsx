import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  runPerformanceAnalysis,
  optimizePerformance,
  getOptimizationRecommendations,
  type PerformanceMetric,
  type QueryPerformanceResult
} from '@/utils/performanceUtils';
import {
  Activity,
  Database,
  HardDrive,
  MonitorSpeaker,
  Bell,
  Archive,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Loader,
  RefreshCw,
  Gauge,
  BarChart3
} from 'lucide-react';

interface PerformanceAnalysisResult {
  databaseMetrics: QueryPerformanceResult[];
  storageMetrics: PerformanceMetric[];
  memoryMetrics: PerformanceMetric[];
  notificationMetrics: PerformanceMetric[];
  backupMetrics: PerformanceMetric[];
  overallScore: number;
  recommendations: string[];
}

const PerformanceMonitor = () => {
  const [analysisResult, setAnalysisResult] = useState<PerformanceAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Run initial analysis
    handleRunAnalysis();
  }, []);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await runPerformanceAnalysis();
      setAnalysisResult(result);
      setLastAnalysisTime(new Date());
      toast({
        title: 'Performance Analysis Complete',
        description: `Overall performance score: ${result.overallScore}/100`,
      });
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'Failed to complete performance analysis',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await optimizePerformance();
      
      if (result.optimizationsApplied.length > 0) {
        toast({
          title: 'Optimization Complete',
          description: `Applied ${result.optimizationsApplied.length} optimizations`,
        });
        
        // Re-run analysis to see improvements
        setTimeout(handleRunAnalysis, 1000);
      } else {
        toast({
          title: 'No Optimizations Needed',
          description: 'System is already optimized',
        });
      }
      
      if (result.errors.length > 0) {
        console.warn('Optimization errors:', result.errors);
      }
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: 'Failed to optimize performance',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
      case 'fast':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'slow':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'fast':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
      case 'slow':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'MB' || unit === 'ms') {
      return value.toFixed(2);
    }
    if (unit === '%') {
      return value.toFixed(1);
    }
    return Math.round(value).toString();
  };

  const recommendations = getOptimizationRecommendations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
              <Gauge className="h-5 w-5" />
            </div>
            Performance Monitor
            {analysisResult && (
              <Badge 
                variant={analysisResult.overallScore >= 80 ? 'default' : 
                        analysisResult.overallScore >= 60 ? 'secondary' : 'destructive'}
                className="ml-2"
              >
                {analysisResult.overallScore}/100
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Monitor and optimize application performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div className="flex gap-3">
              <Button 
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isAnalyzing ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Run Analysis
              </Button>
              
              <Button 
                onClick={handleOptimize}
                disabled={isOptimizing || !analysisResult}
                variant="outline"
              >
                {isOptimizing ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Optimize
              </Button>
            </div>
            
            {lastAnalysisTime && (
              <div className="text-sm text-muted-foreground">
                Last analysis: {lastAnalysisTime.toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overall Score */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overall Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                  {analysisResult.overallScore}
                </div>
                <div className="flex-1">
                  <Progress value={analysisResult.overallScore} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Performance Status: {getScoreStatus(analysisResult.overallScore)}
                  </p>
                </div>
                <div className="text-right">
                  {analysisResult.overallScore >= 80 ? (
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </div>
              
              {analysisResult.recommendations.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{analysisResult.recommendations.length} optimization recommendations available.</strong>
                    {' '}Check the recommendations tab for details.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {analysisResult && (
        <Tabs defaultValue="database" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Performance
                </CardTitle>
                <CardDescription>
                  Query execution times and database performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.databaseMetrics.map((metric, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${getStatusColor(metric.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <span className="font-medium">{metric.table}</span>
                          <Badge variant="outline" className="text-xs">
                            {metric.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {metric.executionTime.toFixed(2)}ms
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {metric.recordCount} records
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground font-mono">
                        {metric.query}
                      </div>
                      {metric.optimization && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                          💡 {metric.optimization}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Storage Performance
                </CardTitle>
                <CardDescription>
                  Local storage usage and optimization metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.storageMetrics.map((metric, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${getStatusColor(metric.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <span className="font-medium">{metric.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatValue(metric.value, metric.unit)} {metric.unit}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {metric.description}
                      </div>
                      {metric.recommendation && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                          💡 {metric.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MonitorSpeaker className="h-5 w-5" />
                  Memory Performance
                </CardTitle>
                <CardDescription>
                  JavaScript heap memory usage and optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.memoryMetrics.map((metric, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${getStatusColor(metric.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <span className="font-medium">{metric.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatValue(metric.value, metric.unit)} {metric.unit}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {metric.description}
                      </div>
                      {metric.recommendation && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                          💡 {metric.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification System Performance
                </CardTitle>
                <CardDescription>
                  Notification storage and processing metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.notificationMetrics.map((metric, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${getStatusColor(metric.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <span className="font-medium">{metric.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatValue(metric.value, metric.unit)} {metric.unit}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {metric.description}
                      </div>
                      {metric.recommendation && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                          💡 {metric.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Backup System Performance
                </CardTitle>
                <CardDescription>
                  Backup storage and configuration metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.backupMetrics.map((metric, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${getStatusColor(metric.status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(metric.status)}
                          <span className="font-medium">{metric.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatValue(metric.value, metric.unit)} {metric.unit}
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {metric.description}
                      </div>
                      {metric.recommendation && (
                        <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                          💡 {metric.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Optimization Recommendations
                </CardTitle>
                <CardDescription>
                  General performance optimization recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {/* Specific recommendations from analysis */}
                    {analysisResult.recommendations.length > 0 && (
                      <>
                        <div className="font-medium text-orange-700 mb-2">
                          🎯 Specific Recommendations for Your System
                        </div>
                        {analysisResult.recommendations.map((rec, index) => (
                          <div 
                            key={`specific-${index}`}
                            className="p-3 bg-orange-50 border border-orange-200 rounded-lg"
                          >
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-orange-800">{rec}</span>
                            </div>
                          </div>
                        ))}
                        <div className="border-t my-4"></div>
                      </>
                    )}
                    
                    {/* General recommendations */}
                    <div className="font-medium text-blue-700 mb-2">
                      📋 General Performance Best Practices
                    </div>
                    {recommendations.map((rec, index) => (
                      <div 
                        key={`general-${index}`}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-blue-800">{rec}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {isAnalyzing && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <p className="text-muted-foreground">Running performance analysis...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceMonitor;
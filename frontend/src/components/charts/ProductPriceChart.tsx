
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  ReferenceArea,
  Brush,
  AreaChart,
  Area
} from "recharts";
import { ZoomIn, ZoomOut, Calendar, BarChart as BarChartIcon, LineChart as LineChartIcon, ArrowDownToLine, ArrowUpToLine } from "lucide-react";

interface PriceDataPoint {
  date: string;
  price: number;
}

interface ProductPriceChartProps {
  priceData: PriceDataPoint[];
  lowestPrice?: number;
  highestPrice?: number;
  targetPrice?: number;
  currency?: string;
}

export const ProductPriceChart = ({ 
  priceData, 
  lowestPrice, 
  highestPrice,
  targetPrice,
  currency = "$" 
}: ProductPriceChartProps) => {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState("all");
  const [chartType, setChartType] = useState("line");
  const [showTable, setShowTable] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    if (timeRange === "all") return priceData;

    const now = new Date();
    const cutoff = new Date();
    
    switch(timeRange) {
      case "week":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "3month":
        cutoff.setMonth(now.getMonth() - 3);
        break;
      default:
        return priceData;
    }
    
    return priceData.filter(point => new Date(point.date) >= cutoff);
  };

  const filteredData = getFilteredData();
  
  // Calculate statistics
  const statistics = useMemo(() => {
    const prices = filteredData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    // Calculate domain with 5% padding
    const pricePadding = (maxPrice - minPrice) * 0.05;
    const domainMin = Math.max(0, minPrice - pricePadding);
    const domainMax = maxPrice + pricePadding;
    
    // Sort data for table
    const sortedByDate = [...filteredData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Find trends
    const trend = prices.length > 1 ? 
      (prices[prices.length - 1] > prices[0] ? 'up' : 
       prices[prices.length - 1] < prices[0] ? 'down' : 'stable') : 'stable';
    
    return {
      minPrice,
      maxPrice,
      avgPrice,
      domainMin,
      domainMax,
      sortedByDate,
      trend
    };
  }, [filteredData]);
  
  const getTrendColor = () => {
    switch(statistics.trend) {
      case 'up': return theme === 'dark' ? 'text-red-400' : 'text-red-600';
      case 'down': return theme === 'dark' ? 'text-green-400' : 'text-green-600';
      default: return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    }
  };
  
  const getTrendIcon = () => {
    switch(statistics.trend) {
      case 'up': return <ArrowUpToLine className="h-4 w-4" />;
      case 'down': return <ArrowDownToLine className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleZoomIn = () => {
    if (zoomLevel < 3) setZoomLevel(zoomLevel + 0.5);
  };
  
  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel(zoomLevel - 0.5);
  };
  
  const formatPrice = (value: number) => {
    return `${currency}${value.toFixed(2)}`;
  };

  // Custom tooltip formatter
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-md shadow-lg ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <p className="text-sm font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className={`text-base font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className={`transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Price History
                <Badge variant={statistics.trend === 'down' ? 'default' : statistics.trend === 'up' ? 'destructive' : 'outline'} 
                  className={`ml-2 flex items-center gap-1 ${statistics.trend === 'stable' ? '' : 'text-white'}`}>
                  {getTrendIcon()}
                  {statistics.trend === 'up' ? 'Rising' : statistics.trend === 'down' ? 'Falling' : 'Stable'}
                </Badge>
              </CardTitle>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <ToggleGroup 
                type="single" 
                value={timeRange} 
                onValueChange={(value) => value && setTimeRange(value)}
                className="justify-start"
              >
                <ToggleGroupItem value="week">1W</ToggleGroupItem>
                <ToggleGroupItem value="month">1M</ToggleGroupItem>
                <ToggleGroupItem value="3month">3M</ToggleGroupItem>
                <ToggleGroupItem value="all">All</ToggleGroupItem>
              </ToggleGroup>
              
              <ToggleGroup 
                type="single" 
                value={chartType} 
                onValueChange={(value) => value && setChartType(value)}
                className="justify-start"
              >
                <ToggleGroupItem value="line" aria-label="Show line chart">
                  <LineChartIcon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="bar" aria-label="Show bar chart">
                  <BarChartIcon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="area" aria-label="Show area chart">
                  <Calendar className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex justify-end mb-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomOut} 
              disabled={zoomLevel <= 0.5}
              className="h-8 w-8 p-0"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleZoomIn} 
              disabled={zoomLevel >= 3}
              className="h-8 w-8 p-0"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowTable(!showTable)}
              className="px-2 h-8"
            >
              {showTable ? 'Show Chart' : 'Show Table'}
            </Button>
          </div>
          
          <div className="h-[300px]" style={{ transform: `scale(${zoomLevel})` }}>
            {!showTable ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(tick) => {
                        const date = new Date(tick);
                        return `${date.getMonth()+1}/${date.getDate()}`;
                      }}
                      minTickGap={15}
                      stroke={theme === 'dark' ? '#999' : '#666'}
                    />
                    <YAxis 
                      domain={[statistics.domainMin, statistics.domainMax]} 
                      tickFormatter={(tick) => `${currency}${tick.toFixed(0)}`}
                      width={65}
                      stroke={theme === 'dark' ? '#999' : '#666'}
                    />
                    <Tooltip content={renderCustomTooltip} />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#1a73e8" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: "#1a73e8", stroke: "#1a73e8" }} 
                      activeDot={{ r: 6, fill: "#1a73e8", stroke: "white", strokeWidth: 2 }}
                      animationDuration={1500}
                      animationEasing="ease-out"
                    />
                    {targetPrice && (
                      <ReferenceLine 
                        y={targetPrice} 
                        stroke="#34a853" 
                        strokeDasharray="3 3" 
                        label={{ value: 'Target', position: 'insideBottomRight', fill: '#34a853' }}
                      />
                    )}
                    {priceData.length > 10 && <Brush dataKey="date" height={20} stroke="#1a73e8" />}
                  </LineChart>
                ) : chartType === "bar" ? (
                  <BarChart data={filteredData} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(tick) => {
                        const date = new Date(tick);
                        return `${date.getMonth()+1}/${date.getDate()}`;
                      }}
                      minTickGap={15}
                      stroke={theme === 'dark' ? '#999' : '#666'}
                    />
                    <YAxis 
                      domain={[statistics.domainMin, statistics.domainMax]} 
                      tickFormatter={(tick) => `${currency}${tick.toFixed(0)}`}
                      width={65}
                      stroke={theme === 'dark' ? '#999' : '#666'}
                    />
                    <Tooltip content={renderCustomTooltip} />
                    <Bar 
                      dataKey="price" 
                      fill="#1a73e8" 
                      animationDuration={1500}
                    />
                    {targetPrice && (
                      <ReferenceLine 
                        y={targetPrice} 
                        stroke="#34a853" 
                        strokeDasharray="3 3" 
                        label={{ value: 'Target', position: 'insideBottomRight', fill: '#34a853' }}
                      />
                    )}
                  </BarChart>
                ) : (
                  <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1a73e8" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#444' : '#ddd'} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(tick) => {
                        const date = new Date(tick);
                        return `${date.getMonth()+1}/${date.getDate()}`;
                      }}
                      minTickGap={15}
                      stroke={theme === 'dark' ? '#999' : '#666'}
                    />
                    <YAxis 
                      domain={[statistics.domainMin, statistics.domainMax]} 
                      tickFormatter={(tick) => `${currency}${tick.toFixed(0)}`}
                      width={65}
                      stroke={theme === 'dark' ? '#999' : '#666'}
                    />
                    <Tooltip content={renderCustomTooltip} />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#1a73e8" 
                      fillOpacity={1}
                      fill="url(#colorPrice)" 
                      animationDuration={1500}
                    />
                    {targetPrice && (
                      <ReferenceLine 
                        y={targetPrice} 
                        stroke="#34a853" 
                        strokeDasharray="3 3" 
                        label={{ value: 'Target', position: 'insideBottomRight', fill: '#34a853' }}
                      />
                    )}
                    {priceData.length > 10 && <Brush dataKey="date" height={20} stroke="#1a73e8" />}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.sortedByDate.map((data, index) => {
                      const prevPrice = index < statistics.sortedByDate.length - 1 ? 
                        statistics.sortedByDate[index + 1].price : data.price;
                      const change = data.price - prevPrice;
                      const percentChange = prevPrice ? (change / prevPrice) * 100 : 0;
                      
                      return (
                        <TableRow key={data.date}>
                          <TableCell>{new Date(data.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(data.price)}</TableCell>
                          <TableCell className={`text-right ${
                            change > 0 ? 'text-red-500' : change < 0 ? 'text-green-500' : ''
                          }`}>
                            {change !== 0 && (
                              <>
                                {change > 0 ? '+' : ''}{formatPrice(change)} 
                                ({change > 0 ? '+' : ''}{percentChange.toFixed(2)}%)
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className={`grid grid-cols-3 gap-2 text-sm border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
          <div className="text-center">
            <div className="text-gray-500">Lowest</div>
            <div className="font-bold text-green-500">{formatPrice(statistics.minPrice)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Average</div>
            <div className="font-bold">{formatPrice(statistics.avgPrice)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">Highest</div>
            <div className="font-bold text-red-500">{formatPrice(statistics.maxPrice)}</div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export const PriceChartSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Skeleton className="h-7 w-32" />
          <div className="flex flex-row gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
      </CardContent>
      <CardFooter className="grid grid-cols-3 gap-2 text-sm border-t pt-4">
        <div className="text-center">
          <Skeleton className="h-4 w-12 mx-auto mb-2" />
          <Skeleton className="h-5 w-16 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-4 w-12 mx-auto mb-2" />
          <Skeleton className="h-5 w-16 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-4 w-12 mx-auto mb-2" />
          <Skeleton className="h-5 w-16 mx-auto" />
        </div>
      </CardFooter>
    </Card>
  );
};

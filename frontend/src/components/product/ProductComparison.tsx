
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
  AreaChart,
  Area,
} from "recharts";
import { ExternalLink, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface PlatformPriceData {
  platform: string;
  currentPrice: number;
  currency: string;
  url: string;
  available: boolean;
  priceHistory?: Array<{date: string; price: number}>;
  logo: string;
  shipping?: number;
  discount?: {
    originalPrice: number;
    percentage: number;
  };
  trend: "up" | "down" | "stable";
  trendAmount?: number;
}

interface ProductComparisonProps {
  productName: string;
  platforms: PlatformPriceData[];
}

export const ProductComparison = ({ productName, platforms }: ProductComparisonProps) => {
  const { theme } = useTheme();
  const [activePlatform, setActivePlatform] = useState<string>(platforms[0]?.platform || "");
  
  // Sort platforms by price (lowest first)
  const sortedPlatforms = [...platforms].sort((a, b) => {
    const totalA = a.currentPrice + (a.shipping || 0);
    const totalB = b.currentPrice + (b.shipping || 0);
    return totalA - totalB;
  });
  
  // Find cheapest platform
  const cheapestPlatform = sortedPlatforms[0];
  
  const formatPrice = (price: number, currency: string = "$") => {
    return `${currency}${price.toFixed(2)}`;
  };
  
  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getTrendColor = (trend: string) => {
    switch(trend) {
      case "up":
        return "text-red-500";
      case "down":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };
  
  const calculateSavings = () => {
    if (platforms.length <= 1) return null;
    
    const highestPrice = Math.max(...platforms.map(p => p.currentPrice + (p.shipping || 0)));
    const lowestPrice = Math.min(...platforms.map(p => p.currentPrice + (p.shipping || 0)));
    const savingsAmount = highestPrice - lowestPrice;
    const savingsPercent = (savingsAmount / highestPrice) * 100;
    
    if (savingsAmount <= 0) return null;
    
    return {
      amount: savingsAmount,
      percent: savingsPercent
    };
  };
  
  const savings = calculateSavings();
  
  // Custom tooltip for price charts
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className={`p-3 rounded shadow-lg ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-200'}`}>
          <p className="text-sm font-medium">{new Date(label).toLocaleDateString()}</p>
          <p className="text-base font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(data.value, platforms.find(p => p.platform === activePlatform)?.currency)}
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
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className={`transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-xl">Price Comparison</CardTitle>
            {savings && (
              <Badge className="bg-green-600">
                Save up to {formatPrice(savings.amount)} ({savings.percent.toFixed(1)}%)
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{productName}</p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="history">Price History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comparison" className="space-y-4">
              <div className="grid gap-4">
                {sortedPlatforms.map((platform, index) => {
                  const isLowestPrice = index === 0;
                  const totalPrice = platform.currentPrice + (platform.shipping || 0);
                  
                  return (
                    <motion.div 
                      key={platform.platform}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className={`${isLowestPrice ? 'border-green-500 dark:border-green-600' : ''} overflow-hidden`}>
                        {isLowestPrice && (
                          <div className="bg-green-500 text-white text-xs font-medium text-center py-1">
                            BEST PRICE
                          </div>
                        )}
                        
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                <img 
                                  src={platform.logo} 
                                  alt={platform.platform} 
                                  className="max-w-full max-h-full object-contain" 
                                />
                              </div>
                              
                              <div>
                                <h3 className="font-medium">{platform.platform}</h3>
                                <div className="flex items-center text-sm gap-1 text-gray-500">
                                  {platform.available ? 
                                    <span className="text-green-500 text-xs">In Stock</span> : 
                                    <span className="text-gray-500 text-xs">Out of Stock</span>
                                  }
                                  
                                  {platform.trend !== "stable" && platform.trendAmount && (
                                    <span className={`flex items-center gap-1 text-xs ${getTrendColor(platform.trend)}`}>
                                      • {getTrendIcon(platform.trend)} 
                                      {platform.trend === "down" ? "-" : "+"}{formatPrice(platform.trendAmount)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="flex items-baseline gap-2">
                                <span className="font-bold text-lg">
                                  {formatPrice(platform.currentPrice, platform.currency)}
                                </span>
                                {platform.discount && (
                                  <span className="text-sm line-through text-gray-500">
                                    {formatPrice(platform.discount.originalPrice, platform.currency)}
                                  </span>
                                )}
                              </div>
                              
                              {platform.shipping !== undefined && (
                                <div className="text-sm text-gray-500">
                                  {platform.shipping > 0 
                                    ? `+ ${formatPrice(platform.shipping, platform.currency)} shipping` 
                                    : "Free shipping"}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-3 flex justify-end">
                            <Button asChild variant="outline" size="sm" className="gap-1">
                              <a href={platform.url} target="_blank" rel="noopener noreferrer">
                                View <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <div className="w-full">
                <TabsList className="mb-4 w-full justify-start overflow-auto pb-1">
                  {platforms.map((platform) => (
                    <TabsTrigger 
                      key={platform.platform}
                      value={platform.platform}
                      onClick={() => setActivePlatform(platform.platform)}
                      className="min-w-fit"
                    >
                      {platform.platform}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <div className="h-[250px]">
                  {platforms.map((platform) => (
                    <div 
                      key={platform.platform}
                      className={activePlatform === platform.platform ? 'block' : 'hidden'}
                    >
                      {platform.priceHistory && platform.priceHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={platform.priceHistory}>
                            <defs>
                              <linearGradient id={`color${platform.platform}`} x1="0" y1="0" x2="0" y2="1">
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
                              stroke={theme === 'dark' ? '#999' : '#666'}
                            />
                            <YAxis 
                              tickFormatter={(tick) => formatPrice(tick, platform.currency)}
                              width={65}
                              stroke={theme === 'dark' ? '#999' : '#666'}
                            />
                            <Tooltip content={renderCustomTooltip} />
                            <Area 
                              type="monotone" 
                              dataKey="price" 
                              stroke="#1a73e8" 
                              fillOpacity={1}
                              fill={`url(#color${platform.platform})`} 
                              animationDuration={1500}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-gray-500">No price history available for {platform.platform}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const ProductComparisonSkeleton = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-60 mt-1" />
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div>
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-16 mt-1" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

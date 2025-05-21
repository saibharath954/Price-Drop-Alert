import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";
import { TrendingDown, Box, Clock, ArrowDownRight } from "lucide-react";

interface DashboardStatsProps {
  totalTracked: number;
  averagePrice: number;
  currency: string;
  averageSavings?: number;
  lowestPrice?: {
    name: string;
    price: number;
    discount: number;
  };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalTracked,
  averagePrice,
  currency,
  averageSavings,
  lowestPrice,
}) => {
  const { theme } = useTheme();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <Card
        className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}
      >
        <CardContent className="p-6 flex items-center space-x-4">
          <div
            className={`rounded-full p-3 ${theme === "dark" ? "bg-blue-900/30" : "bg-blue-100"}`}
          >
            <Box
              className={`h-6 w-6 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
            />
          </div>
          <div>
            <p
              className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              Total Products
            </p>
            <h4 className="text-2xl font-bold">{totalTracked}</h4>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}
      >
        <CardContent className="p-6 flex items-center space-x-4">
          <div
            className={`rounded-full p-3 ${theme === "dark" ? "bg-green-900/30" : "bg-green-100"}`}
          >
            <TrendingDown
              className={`h-6 w-6 ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
            />
          </div>
          <div>
            <p
              className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              Average Price
            </p>
            <h4 className="text-2xl font-bold">
              {currency}
              {averagePrice.toFixed(2)}
            </h4>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}
      >
        <CardContent className="p-6 flex items-center space-x-4">
          <div
            className={`rounded-full p-3 ${theme === "dark" ? "bg-purple-900/30" : "bg-purple-100"}`}
          >
            <Clock
              className={`h-6 w-6 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}
            />
          </div>
          <div>
            <p
              className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              Average Savings
            </p>
            <h4 className="text-2xl font-bold">
              {averageSavings
                ? `${currency}${averageSavings.toFixed(2)}`
                : "N/A"}
            </h4>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}
      >
        <CardContent className="p-6 flex items-center space-x-4">
          <div
            className={`rounded-full p-3 ${theme === "dark" ? "bg-amber-900/30" : "bg-amber-100"}`}
          >
            <ArrowDownRight
              className={`h-6 w-6 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}
            />
          </div>
          <div>
            <p
              className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              Top Discount
            </p>
            <h4 className="text-2xl font-bold">
              {lowestPrice ? `${lowestPrice.discount}%` : "N/A"}
            </h4>
            {lowestPrice && (
              <p
                className={`text-xs truncate max-w-28 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
              >
                {lowestPrice.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HowItWorks = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-10">How PricePulse Works</h1>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">1</div>
                Track Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Enter the URL of any Amazon product you want to track. Our system will start monitoring
                the price automatically, checking for changes multiple times per day.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">2</div>
                View Price History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                See how prices have changed over time with our interactive charts.
                Identify trends and patterns to make informed decisions about when to buy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">3</div>
                Get Notified
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Set your target price and add your email address. We'll send you an alert
                as soon as the price drops to your desired level so you never miss a deal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">4</div>
                AI-Powered Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Our AI technology identifies your product and finds identical or similar items
                on other e-commerce platforms, giving you a comprehensive price comparison.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">5</div>
                Automatic Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Our system automatically checks prices every hour, ensuring you have
                the most up-to-date information without having to manually refresh.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">6</div>
                Make Smart Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                With historical data and price alerts, you can make informed decisions
                about when to purchase products at their best possible prices.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to start saving?</h2>
          <a 
            href="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Track Your First Product
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default HowItWorks;

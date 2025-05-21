import { Layout } from "@/components/layout/Layout";

const About = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-10">
          About PricePulse
        </h1>

        <div className="prose lg:prose-xl mx-auto">
          <p className="lead text-xl text-gray-600 mb-8">
            PricePulse is a cutting-edge price tracking and comparison platform
            designed to help consumers make smarter purchasing decisions.
          </p>

          <h2>Our Mission</h2>
          <p>
            Our mission is to empower consumers with data-driven insights into
            price trends, ensuring they never overpay for products they love. By
            combining advanced web scraping technology with AI-powered
            comparisons, we provide the most comprehensive price tracking
            solution available.
          </p>

          <h2>Why Choose PricePulse?</h2>
          <ul>
            <li>
              <strong>Real-time tracking:</strong> Our system checks prices
              multiple times per day, providing you with the most current
              information.
            </li>
            <li>
              <strong>Historical data:</strong> View price trends over time to
              identify patterns and make informed buying decisions.
            </li>
            <li>
              <strong>Multi-platform comparison:</strong> Compare prices across
              different e-commerce sites to find the best deals.
            </li>
            <li>
              <strong>Price drop alerts:</strong> Set your desired price and get
              notified immediately when prices fall to your target.
            </li>
            <li>
              <strong>User privacy:</strong> We never sell your data or share
              your information with third parties.
            </li>
          </ul>

          <h2>Our Technology</h2>
          <p>
            PricePulse is built using a modern tech stack that includes React
            for the frontend, a robust backend API, and advanced web scraping
            techniques that comply with retailer terms of service. Our
            AI-powered product matching system ensures accurate comparisons
            across different platforms.
          </p>

          <h2>Contact Us</h2>
          <p>
            Have questions, suggestions, or feedback? We'd love to hear from
            you! Email us at{" "}
            <a
              href="mailto:support@pricepulse.com"
              className="text-blue-600 hover:underline"
            >
              support@pricepulse.com
            </a>
            .
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default About;

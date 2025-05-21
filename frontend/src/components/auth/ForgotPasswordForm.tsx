import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword } = useUser();
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={`w-full max-w-md mx-auto ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white"}`}
    >
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Reset Password
        </CardTitle>
        <CardDescription className="text-center">
          {!isSubmitted
            ? "Enter your email address and we'll send you a link to reset your password"
            : "Check your email for a reset link"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="youremail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending email...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center p-4 space-y-4">
            <div
              className={`rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center ${theme === "dark" ? "bg-green-900/20" : "bg-green-100"}`}
            >
              <Mail
                className={`h-8 w-8 ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
              />
            </div>
            <p
              className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
            >
              We've sent a password reset link to{" "}
              <span className="font-medium">{email}</span>.
            </p>
            <p
              className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-sm`}
            >
              Please check your inbox and spam folder. The link will expire
              after 24 hours.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsSubmitted(false)}
            >
              Send another email
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          to="/login"
          className={`text-sm flex items-center ${theme === "dark" ? "text-blue-400" : "text-blue-600"} hover:underline`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
};

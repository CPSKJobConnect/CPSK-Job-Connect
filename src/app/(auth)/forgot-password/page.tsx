"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter the email associated with your account.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to submit password reset request.");
        return;
      }

      setStatusMessage(
        payload.message ||
          "If an account exists for that email, we'll send reset instructions shortly."
      );
      setEmail("");
    } catch (error) {
      console.error("Password reset request failed:", error);
      setErrorMessage("Something went wrong. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <button
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to previous page
        </button>

        <Card className="shadow-lg border border-blue-100">
          <CardHeader>
            <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Security</p>
            <CardTitle className="text-2xl text-gray-900">Forgot your password?</CardTitle>
            <CardDescription className="text-gray-600">
              Enter the email linked to your CPSK Job Connect account and we&apos;ll send you a secure
              link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="bg-white"
                />
              </div>

              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
              {statusMessage && <p className="text-sm text-emerald-600">{statusMessage}</p>}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending link..." : "Send reset link"}
              </Button>
            </form>

            <div className="mt-6 text-sm text-center text-gray-600">
              <p>
                Remembered your password?{" "}
                <Link href="/login/student" className="text-emerald-600 hover:underline">
                  Return to login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

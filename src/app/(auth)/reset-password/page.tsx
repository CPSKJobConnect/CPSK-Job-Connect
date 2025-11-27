"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { PASSWORD_REQUIREMENTS, evaluatePasswordPolicy } from "@/lib/passwordPolicy";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  useEffect(() => {
    const paramToken = searchParams.get("token");
    setToken(paramToken);
  }, [searchParams]);

  const tokenMissing = useMemo(() => !token, [token]);

  const passwordPolicyResults = useMemo(
    () => evaluatePasswordPolicy(password, { email: "" }),
    [password]
  );

  // Handle redirect countdown
  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown === 0) {
      router.push("/login/student?reset=success");
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatusMessage("");
    setErrorMessage("");

    if (!token) {
      setErrorMessage("This reset link is missing or has expired. Please request a new one.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/password-reset/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(payload.error || "Unable to reset password.");
        return;
      }

      setStatusMessage(
        payload.message || "Password updated successfully. Redirecting you to sign in…"
      );
      setPassword("");
      setConfirmPassword("");
      setRedirectCountdown(5);
    } catch (error) {
      console.error("Password reset failed:", error);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Card className="shadow-lg border border-emerald-100">
          <CardHeader className="space-y-3">
            <div className="inline-flex items-center gap-2 text-emerald-600 text-sm font-semibold uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              Account Security
            </div>
            <CardTitle className="text-2xl text-gray-900">Set a new password</CardTitle>
            <CardDescription className="text-gray-600">
              Choose a strong password to secure your CPSK Job Connect account.
            </CardDescription>
            {tokenMissing && (
              <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
                This reset link is missing a token or has expired. Please{" "}
                <Link className="underline" href="/forgot-password">
                  request a new password reset email
                </Link>
                .
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm new password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="bg-white"
                />
              </div>

              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold mb-2">Password requirements</p>
                <ul className="space-y-1 text-sm">
                  {PASSWORD_REQUIREMENTS.map((label) => {
                    const result = passwordPolicyResults.find((item) => item.label === label)
                    const hasInput = password.length > 0
                    const passed = hasInput && (result?.passed ?? false)
                    return (
                      <li key={label} className="flex items-center gap-2">
                        {passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={passed ? "text-emerald-700" : "text-gray-700"}>{label}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
              {statusMessage && (
                <p className="text-sm text-emerald-600">
                  {statusMessage}
                  {redirectCountdown !== null && redirectCountdown > 0 && (
                    <> You will be redirected in {redirectCountdown}s.</>
                  )}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={isSubmitting || tokenMissing}
              >
                {isSubmitting ? "Updating password..." : "Update password"}
              </Button>
            </form>

            <div className="mt-6 text-sm text-center text-gray-600">
              <p>
                Ready to sign in?{" "}
                <Link href="/login/student" className="text-emerald-600 hover:underline">
                  Go to login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

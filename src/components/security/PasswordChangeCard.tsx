"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PASSWORD_REQUIREMENTS, evaluatePasswordPolicy } from "@/lib/passwordPolicy";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";

export function PasswordChangeCard() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const policyResults = useMemo(
    () =>
      evaluatePasswordPolicy(newPassword, {
        email: session?.user?.email ?? undefined,
        username: session?.user?.username ?? undefined,
        name: session?.user?.name ?? undefined,
      }),
    [newPassword, session?.user?.email, session?.user?.name, session?.user?.username]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(payload.error || "Failed to update password");
        return;
      }

      toast.success(payload.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Failed to update password:", error);
      toast.error("Failed to update password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allChecksPassed = policyResults.every((result) => result.passed);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password & Session Security</CardTitle>
        <CardDescription>
          Update your password and review policy requirements. Leave the current password blank if you signed up with Google and never set one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Enter your current password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Use a strong, unique password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
            />
          </div>

          <div className="rounded-md border border-dashed border-gray-300 p-4">
            <p className="text-sm font-medium text-gray-800 mb-2">Password requirements</p>
            <ul className="space-y-1 text-sm">
              {PASSWORD_REQUIREMENTS.map((requirement) => {
                const policyResult = policyResults.find((result) => result.label === requirement);
                const passed = policyResult?.passed ?? false;
                return (
                  <li key={requirement} className={passed ? "text-green-600" : "text-gray-600"}>
                    {passed ? "•" : "○"} {requirement}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting || !newPassword || !allChecksPassed || newPassword !== confirmPassword}>
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out of this session
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

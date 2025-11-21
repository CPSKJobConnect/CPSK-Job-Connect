"use client"

import PrivacyModal from "@/components/PrivacyModal"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PASSWORD_REQUIREMENTS, evaluatePasswordPolicy } from "@/lib/passwordPolicy"
import { ROLE_CONFIGS } from "@/lib/role-config"
import { AuthFormData, Role } from "@/types/auth"
import { CheckCircle2, Eye, EyeOff, Upload, XCircle } from "lucide-react"
import { signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

interface AuthFormProps {
  role: Role
  mode: "login" | "register"
  isOAuthCompletion?: boolean
}

export function AuthForm({ role, mode, isOAuthCompletion = false }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false)
  const [isCompletingRegistration, setIsCompletingRegistration] = useState(false)
  const [error, setError] = useState("")
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [awaitingSession, setAwaitingSession] = useState(false)
  const [studentStatus, setStudentStatus] = useState<"CURRENT" | "ALUMNI">("CURRENT")
  const [actualUserRole, setActualUserRole] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<AuthFormData | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update } = useSession()

  const callbackUrl = searchParams.get("callbackUrl")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError: setFieldError,
    watch,
  } = useForm<AuthFormData>({
    // Remove Zod resolver for frontend - validation happens on backend
    // resolver: zodResolver(schema),
  })

  const emailValue = watch("email")
  const passwordValue = watch("password") || ""
  const yearValue = watch("year")

  useEffect(() => {
    if (mode === "register" && role === "student" && studentStatus === "ALUMNI") {
      setValue("year", "Alumni")
    }
  }, [studentStatus, mode, role, setValue])

  useEffect(() => {
    if (isOAuthCompletion && session?.user?.email) {
      setValue("email", session.user.email)
    }
  }, [isOAuthCompletion, session, setValue])

  useEffect(() => {
    if (isOAuthCompletion && session?.user?.email && role === "student") {
      const email = session.user.email.toLowerCase()
      if (!email.endsWith("@ku.th")) {
        setStudentStatus("ALUMNI")
        setValue("year", "Alumni", { shouldValidate: true })
      }
    }
  }, [isOAuthCompletion, session, role, setValue])

  useEffect(() => {
    if (awaitingSession && session?.user?.role) {
      setAwaitingSession(false)
      setIsLoading(false)

      if (callbackUrl) {
        router.push(callbackUrl)
      } else {
        const normalizedRole = session.user.role.toLowerCase() as Role
        const userRoleConfig = ROLE_CONFIGS[normalizedRole]
        router.push(userRoleConfig?.redirectPath || `/${normalizedRole}/dashboard`)
      }
    }
  }, [session, awaitingSession, router, callbackUrl])

  // Clear stale session cookie after auto-logout redirects
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (mode === "login" && errorParam === "session_expired") {
      signOut({ redirect: false })
    }
  }, [mode, searchParams, signOut])

  const passwordPolicyResults = useMemo(
    () =>
      mode === "register" && !isOAuthCompletion
        ? evaluatePasswordPolicy(passwordValue, { email: emailValue })
        : [],
    [emailValue, mode, passwordValue, isOAuthCompletion]
  )

  const roleConfig = useMemo(() => ROLE_CONFIGS[role], [role])
  const Icon = roleConfig.icon

  const performRegistration = async (data: AuthFormData, file?: File | null) => {
    try {
      if (mode === "register" && role === "student" && studentStatus === "CURRENT") {
        if (!data.email.toLowerCase().endsWith("@ku.th")) {
          setError("Current students must use a KU email address (@ku.th). If you don't have access to your KU email, please register as Alumni instead and provide your transcript for verification.")
          return
        }
      }

      if (mode === "register" && role === "student" && studentStatus === "ALUMNI") {
        if (!file) {
          setError("Alumni must upload a transcript")
          return
        }
      }

      if (mode === "register" && role === "company") {
        if (!file) {
          setError("Company evidence document is required")
          return
        }
      }
      
      console.log("Starting registration, isOAuthCompletion:", isOAuthCompletion)
      const formData = new FormData()
      formData.append("role", role)
      formData.append("email", data.email)

      if (isOAuthCompletion) {
        console.log("OAuth registration - skipping password fields")
        formData.append("isOAuth", "true")
      } else {
        console.log("Credentials registration - including password fields")
        formData.append("password", data.password!)
        formData.append("confirmPassword", data.confirmPassword!)
      }

      if (role === "student") {
        formData.append("studentId", data.studentId!)
        formData.append("name", data.name!)
        formData.append("faculty", data.faculty!)
        formData.append("year", data.year!.toString())
        formData.append("phone", data.phone!)
        formData.append("studentStatus", studentStatus)

        if (file) {
          formData.append("transcript", file)
        }
      } else {
        formData.append("companyName", data.companyName!)
        formData.append("address", data.address!)
        formData.append("website", data.website || "")
        formData.append("description", data.description!)
        formData.append("phone", data.phone!)

        if (file) {
          formData.append("evidence", file)
        }
      }

      // Attach consent value from localStorage (safely). Backend expects 'consent' field.
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('pdpaConsent') : null
        const consentToSend = stored === 'true'
        formData.append('consent', String(consentToSend))
      } catch (e) {
        // If localStorage unavailable, send false (backend will handle missing/false gracefully)
        formData.append('consent', 'false')
      }

      const response = await fetch("/api/register", {
        method: "POST",
        body: formData,
      })

      const responseText = await response.text()

      let result
      try {
        result = JSON.parse(responseText)
      } catch (jsonError) {
        setError(`Server returned invalid response. Status: ${response.status}`)
        console.log(`Server returned invalid response when registering: ${jsonError}`)
        return
      }

      if (!response.ok) {
        try {
          if (result && result.details && Array.isArray(result.details)) {
            result.details.forEach((issue: { path: unknown[]; message: string }) => {
              const path = Array.isArray(issue.path) && issue.path.length ? String(issue.path[0]) : null
              if (path) {
                setFieldError(path as keyof AuthFormData, { type: 'server', message: issue.message })
              }
            })
          }
        } catch (e) {
          console.warn('Failed to map server validation details to fields', e)
        }

        setError(result.error || "Registration failed")
      } else {
        if (isOAuthCompletion) {
          console.log("OAuth registration complete, updating session...")

          setIsCompletingRegistration(true)
          setError("")

          await new Promise(resolve => setTimeout(resolve, 500))

          await update()

          router.push(result.redirectTo)
        } else {
          const loginResult = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
          })

          if (loginResult?.error) {
            setError("Registration successful but login failed. Please try logging in.")
          } else {
            router.push(result.redirectTo)
          }
        }
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.")
      console.log("Error during registration submission:", error)
    }
  }

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true)
    setError("")
    setAttemptsRemaining(null) // Clear previous attempts counter
    if (mode === "register") {
      try {
        const consent = typeof window !== 'undefined' ? localStorage.getItem('pdpaConsent') : null
        if (consent !== 'true') {
          setPendingFormData(data)
          setPendingFile(selectedFile)
          setShowConsentModal(true)
          setIsLoading(false)
          return
        }
      } catch (e) {
        setError("Unable to verify privacy consent. Please enable browser storage and accept the privacy policy before registering.")
        setIsLoading(false)
        return
      }
    }

    try {
      if (mode === "register" && role === "student" && studentStatus === "CURRENT") {
        if (!data.email.toLowerCase().endsWith("@ku.th")) {
          setError("Current students must use a KU email address (@ku.th). If you don't have access to your KU email, please register as Alumni instead and provide your transcript for verification.")
          setIsLoading(false)
          return
        }
      }

      if (mode === "register" && role === "student" && studentStatus === "ALUMNI") {
        if (!selectedFile) {
          setError("Alumni must upload a transcript")
          setIsLoading(false)
          return
        }
      }

      if (mode === "register" && role === "company") {
        if (!selectedFile) {
          setError("Company evidence document is required")
          setIsLoading(false)
          return
        }
      }

      if (mode === "login") {
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          role: role,
          redirect: false,
        })

        if (result?.error) {
          // Check if it's a rate limit error
          if (result.error.startsWith("RATE_LIMIT:")) {
            const message = result.error.split(":")[1];
            setActualUserRole(null)
            setError(message)
            setAttemptsRemaining(0) // Locked out
            setIsLoading(false)
          }
          // Check if it's a role mismatch error
          else if (result.error.startsWith("ROLE_MISMATCH:")) {
            const parts = result.error.split(":");
            const actualRole = parts[1];
            const message = parts[2];
            setActualUserRole(actualRole)
            setError(message)
            setIsLoading(false)
          } else if (result.error.startsWith("OAUTH_ACCOUNT:")) {
            const message = result.error.split(":")[1];
            setActualUserRole(null)
            setError(message)
            setIsLoading(false)
          } else if (result.error.toLowerCase().includes("tokenexpired")) {
            await signOut({ redirect: false })
            setActualUserRole(null)
            setError("Your previous session expired. Please sign in again.")
            setAttemptsRemaining(null)
            setIsLoading(false)
          } else if (result.error.startsWith("INVALID_CREDENTIALS:")) {
            // Invalid credentials with attempt counter from backend
            const [, attemptsStr] = result.error.split(":")
            const parsedAttempts = Number(attemptsStr)
            setActualUserRole(null)
            setError("Invalid email or password")
            setAttemptsRemaining(Number.isFinite(parsedAttempts) ? Math.max(0, parsedAttempts) : null)
            setIsLoading(false)
          } else {
            // Generic error fallback
            setActualUserRole(null)
            setError(result.error === "Invalid credentials" ? "Invalid email or password" : result.error)
            setAttemptsRemaining(null)
            setIsLoading(false)
          }
        } else {
          setAwaitingSession(true)
        }
      } else {
        await performRegistration(data, selectedFile)
      }
      
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.")
      console.log("Error during form submission:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchGoogleAccount = useCallback(async () => {
    setIsSwitchingAccount(true)
    try {
      const callbackUrl = mode === "register"
        ? `/register/complete/${role}`
        : roleConfig.redirectPath

      await signIn("google", {
        callbackUrl,
        redirect: true
      })
    } catch (error) {
      setError("Failed to switch account")
      console.log("Switch account error:", error)
      setIsSwitchingAccount(false)
    }
  }, [mode, role, roleConfig.redirectPath])

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true)
    try {
      const callbackUrl = mode === "register"
        ? `/register/complete/${role}`
        : roleConfig.redirectPath

      await signIn("google", {
        callbackUrl,
        redirect: true
      })
    } catch (error) {
      setError("Google sign-in failed")
      console.log("Google sign-in error:", error)
      setIsLoading(false)
    }
  }, [mode, role, roleConfig.redirectPath])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    const file = files?.[0]
    if (file && files) {
      setSelectedFile(file)
      if (role === "student") {
        setValue("transcript", files)
      } else if (role === "company") {
        setValue("evidence", files)
      }
    }
  }, [role, setValue])

  return (
    <Card className={`w-full max-w-md bg-white ${roleConfig.secondaryColor.split(' ')[0]}`}>
      <CardHeader className="text-center">
        <div className={`w-16 h-16 ${roleConfig.secondaryColor.split(' ').slice(1, 3).join(' ').replace('text-', 'bg-').replace('-700', '-100')} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-8 h-8 ${roleConfig.secondaryColor.split(' ').slice(1, 3).join(' ')}`} />
        </div>
        <CardTitle className="text-2xl">
          {mode === "login" ? "Sign in" : "Create Account"} as {roleConfig.title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isOAuthCompletion && session?.user?.email && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <AlertDescription>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-blue-900">
                  <strong>Completing registration for:</strong> {session.user.email}
                </p>
                <p className="text-xs text-blue-700">
                  Not your account? Click &quot;Use a different Google account&quot; below the email field.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert data-testid="auth-form-error-card" className="mb-4" variant="destructive">
            <AlertDescription>
              <div className="flex flex-col gap-2">
                <p>{error}</p>
                {mode === "login" && attemptsRemaining !== null && attemptsRemaining > 0 && (
                  <p className="text-sm text-red-800 mt-1">
                    ⚠️ <strong>{attemptsRemaining}</strong> {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining before account lockout
                  </p>
                )}
                {mode === "login" && attemptsRemaining === 0 && (
                  <p className="text-sm text-red-900 font-semibold mt-1">
                    🔒 Account locked. Please wait before trying again.
                  </p>
                )}
                {actualUserRole && mode === "login" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full sm:w-auto bg-white hover:bg-gray-50"
                    onClick={() => router.push(`/login/${actualUserRole}`)}
                  >
                    Go to {actualUserRole === "student" ? "Student" : "Company"} Login →
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log("Form validation errors:", errors)
          const filteredErrors = isOAuthCompletion
            ? Object.entries(errors).filter(([field]) => field !== 'password' && field !== 'confirmPassword')
            : Object.entries(errors);

          const firstError = filteredErrors[0]
          if (firstError) {
            const [field, error] = firstError
            setError(`${field}: ${error.message || 'Invalid value'}`)
          } else if (!isOAuthCompletion) {
            setError("Please fix the form errors before submitting")
          }
        })} className="space-y-4">
          <div>
            <Label htmlFor="email">
              Email
              {mode === "register" && role === "student" && studentStatus === "CURRENT" && !isOAuthCompletion && (
                <span className="text-xs text-gray-500 ml-2">(Must be KU email: @ku.th)</span>
              )}
              {isOAuthCompletion && (
                <span className="text-xs text-green-600 ml-2">✓ Verified by Google</span>
              )}
            </Label>
            <Input
              id="email"
              data-testid="email"
              type="email"
              {...register("email")}
              className="mt-1 bg-gray-50"
              placeholder={
                mode === "register" && role === "student" && studentStatus === "CURRENT"
                  ? "yourname@ku.th"
                  : "Enter your email"
              }
              disabled={isOAuthCompletion}
              readOnly={isOAuthCompletion}
            />
            {errors.email && (
              <p data-testid="error-email" className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
            {mode === "register" && role === "student" && studentStatus === "CURRENT" && emailValue && !emailValue.toLowerCase().endsWith("@ku.th") && !isOAuthCompletion && (
              <p className="text-sm text-amber-600 mt-1">
                ⚠️ Current students must use a KU email address (@ku.th)
              </p>
            )}
            {isOAuthCompletion && (
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchGoogleAccount}
                  disabled={isSwitchingAccount || isLoading}
                  className="text-xs"
                >
                  {isSwitchingAccount ? "Switching account..." : "Use a different Google account"}
                </Button>
              </div>
            )}
          </div>

          {!isOAuthCompletion && (
            <>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    data-testid="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="mt-1 bg-gray-50 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p data-testid="error-password" className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                )}
                {mode === "login" && (
                  <div className="mt-2 text-right">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline focus-visible:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              {mode === "register" && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      data-testid="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      {...register("confirmPassword")}
                      className="mt-1 bg-gray-50 pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p data-testid="error-confirmPassword" className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              )}

              {mode === "register" && !isOAuthCompletion && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-semibold mb-2">Password requirements</p>
                  <ul className="space-y-1 text-sm">
                    {PASSWORD_REQUIREMENTS.map((label) => {
                      const result = passwordPolicyResults.find((item) => item.label === label)
                      const hasInput = passwordValue.length > 0
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
              )}
            </>
          )}

          {mode === "register" && (
            <>
              {role === "student" ? (
                <>
                  <div className="space-y-3">
                    <Label>I am a</Label>
                    <div className="flex gap-4">
                      <label className={`flex items-center space-x-2 ${
                        isOAuthCompletion && session?.user?.email && !session.user.email.toLowerCase().endsWith("@ku.th")
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}>
                        <input
                          type="radio"
                          name="studentStatus"
                          value="CURRENT"
                          checked={studentStatus === "CURRENT"}
                          onChange={(e) => setStudentStatus(e.target.value as "CURRENT" | "ALUMNI")}
                          disabled={!!(isOAuthCompletion && session?.user?.email && !session.user.email.toLowerCase().endsWith("@ku.th"))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium">Current KU Student</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="studentStatus"
                          value="ALUMNI"
                          checked={studentStatus === "ALUMNI"}
                          onChange={(e) => setStudentStatus(e.target.value as "CURRENT" | "ALUMNI")}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium">KU Alumni</span>
                      </label>
                    </div>
                    {isOAuthCompletion && session?.user?.email && !session.user.email.toLowerCase().endsWith("@ku.th") && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-900">
                          <strong>Note:</strong> Your Google account ({session.user.email}) is not a KU email (@ku.th), so you must register as Alumni. Your account will require admin approval with transcript verification.
                        </p>
                      </div>
                    )}
                    {studentStatus === "CURRENT" && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs text-blue-900">
                          <strong>Current students:</strong> Must use KU email (@ku.th) for instant verification. You&apos;ll need to verify your email after registration.
                        </p>
                      </div>
                    )}
                    {studentStatus === "ALUMNI" && !(isOAuthCompletion && session?.user?.email && !session.user.email.toLowerCase().endsWith("@ku.th")) && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-900">
                          <strong>Alumni:</strong> Can use any email address. Your account requires admin approval - please upload your transcript for verification.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      {...register("studentId")}
                      className="mt-1 bg-gray-50"
                      placeholder="e.g., 6610545XXX"
                    />
                    {errors.studentId && (
                      <p className="text-sm text-red-600 mt-1">{errors.studentId.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      {...register("name")}
                      className="mt-1 bg-gray-50"
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select
                      onValueChange={(value) => setValue("faculty", value, { shouldValidate: true })}
                      defaultValue={watch("faculty")}
                    >
                      <SelectTrigger data-testid="faculty-select" className="mt-1 bg-gray-50">
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem data-testid="ske" value="Software and Knowledge Engineering (SKE)">
                          Software and Knowledge Engineering (SKE)
                        </SelectItem>
                        <SelectItem data-testid="cpe" value="Computer Engineering (CPE)">
                          Computer Engineering (CPE)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.faculty && (
                      <p className="text-sm text-red-600 mt-1">{errors.faculty.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Select
                      onValueChange={(value) => setValue("year", value === "Alumni" ? value : parseInt(value), { shouldValidate: true })}
                      disabled={studentStatus === "ALUMNI"}
                      value={yearValue?.toString()}
                      defaultValue={yearValue?.toString()}
                    >
                      <SelectTrigger data-testid="year-select" className="mt-1 bg-gray-50">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentStatus === "CURRENT" ? (
                          [1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
                            <SelectItem key={year} data-testid={`year-${year}`} value={year.toString()}>
                              Year {year}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem data-testid="year-alumni" value="Alumni">
                            Alumni
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.year && (
                      <p className="text-sm text-red-600 mt-1">{errors.year.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...register("phone")}
                      className="mt-1 bg-gray-50"
                      placeholder="e.g., 0812345XXX"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="transcript">
                      Transcript {studentStatus === "ALUMNI" ? "(Required)" : "(Optional)"}
                    </Label>
                    <div className="mt-1 flex items-center space-x-2 bg-gray-50">
                      <Input
                        id="transcript"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="transcript"
                        className={`flex items-center justify-center w-full h-10 px-3 py-2 border ${
                          studentStatus === "ALUMNI" && !selectedFile
                            ? "border-red-300"
                            : "border-gray-300"
                        } rounded-md cursor-pointer hover:bg-gray-50`}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {selectedFile ? selectedFile.name : "Choose file"}
                      </Label>
                    </div>
                    {studentStatus === "ALUMNI" && !selectedFile && (
                      <p className="text-sm text-red-600 mt-1">Alumni must upload a transcript</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      data-testid="companyName"
                      {...register("companyName")}
                      className="mt-1 bg-gray-50"
                      placeholder="Enter company name"
                    />
                    {errors.companyName && (
                      <p data-testid="error-companyName" className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      data-testid="address"
                      {...register("address")}
                      className="mt-1 bg-gray-50"
                      rows={3}
                      placeholder="Enter company address"
                    />
                    {errors.address && (
                      <p data-testid="error-address" className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      data-testid="website"
                      type="url"
                      {...register("website")}
                      className="mt-1 bg-gray-50"
                      placeholder="https://example.com"
                    />
                    {errors.website && (
                      <p data-testid="error-website" className="text-sm text-red-600 mt-1">{errors.website.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      data-testid="description"
                      {...register("description")}
                      className="mt-1 bg-gray-50"
                      rows={4}
                      placeholder="Describe your company..."
                    />
                    {errors.description && (
                      <p data-testid="error-description" className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      data-testid="phone"
                      {...register("phone")}
                      className="mt-1 bg-gray-50"
                      placeholder="e.g., 0812345XXX"
                    />
                    {errors.phone && (
                      <p data-testid="error-phone" className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="evidence">Company Evidence Document (Required)</Label>
                    <div className="mt-1 flex items-center space-x-2 bg-gray-50">
                      <Input
                        id="evidence"
                        data-testid="evidence"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Label
                        htmlFor="evidence"
                        className={`flex items-center justify-center w-full h-10 px-3 py-2 border ${
                          !selectedFile ? "border-red-300" : "border-gray-300"
                        } rounded-md cursor-pointer hover:bg-gray-50`}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {selectedFile ? selectedFile.name : "Choose evidence file"}
                      </Label>
                    </div>
                    {!selectedFile && (
                      <p data-testid="error-evidence-required" className="text-sm text-red-600 mt-1">
                        Company evidence document is required
                      </p>
                    )}
                    {errors.evidence && (
                      <p data-testid="error-evidence" className="text-sm text-red-600 mt-1">{errors.evidence.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Upload documents like business license, registration certificate, or other proof of company legitimacy
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          <Button
            data-testid="auth-submit"
            type="submit"
            className={`w-full ${roleConfig.primaryColor} cursor-pointer`}
            disabled={isLoading}
          >
            {isLoading
              ? isCompletingRegistration
                ? "Setting up your account..."
                : awaitingSession
                  ? "Authenticating..."
                  : mode === "register"
                    ? "Registering..."
                    : "Loading..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </Button>
          {role !== "admin" && !isOAuthCompletion && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          )}
        </form>

        <div className="mt-6 text-center">
          {mode === "login" ? (
            <p className="text-sm">
              Don&apos;t have an account?{" "}
              <a
                data-testid="auth-signup"
                href={`/register/${role}`}
                className={`${roleConfig.secondaryColor.split(' ').slice(1, 3).join(' ')} hover:opacity-80 font-medium`}
              >
                Sign up
              </a>
            </p>
          ) : (
            <p className="text-sm">
              Already have an account?{" "}
              <a
                href={`/login/${role}`}
                className={`${roleConfig.secondaryColor.split(' ').slice(1, 3).join(' ')} hover:opacity-80 font-medium`}
              >
                Sign in
              </a>
            </p>
          )}
        </div>
        <PrivacyModal
          isOpen={showConsentModal}
          onClose={() => setShowConsentModal(false)}
          onAccept={async () => {
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('pdpaConsent', 'true')
              }
            } catch (e) {
              // ignore
            }
            setShowConsentModal(false)
            if (pendingFormData) {
              setIsLoading(true)
              await performRegistration(pendingFormData, pendingFile)
              setPendingFormData(null)
              setPendingFile(null)
              setIsLoading(false)
            }
          }}
        />
      </CardContent>
    </Card>
  )
}

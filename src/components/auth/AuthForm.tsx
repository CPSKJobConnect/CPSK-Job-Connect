"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ROLE_CONFIGS } from "@/lib/role-config"
import { AuthFormData, Role } from "@/types/auth"
import { Upload } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [awaitingSession, setAwaitingSession] = useState(false)
  const [studentStatus, setStudentStatus] = useState<"CURRENT" | "ALUMNI">("CURRENT")
  const [actualUserRole, setActualUserRole] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, update } = useSession()

  const callbackUrl = searchParams.get("callbackUrl")

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AuthFormData>({
    // Remove Zod resolver for frontend - validation happens on backend
    // resolver: zodResolver(schema),
  })

  const emailValue = watch("email")
  const yearValue = watch("year")

  // Auto-select "Alumni" year when student status is ALUMNI
  useEffect(() => {
    if (mode === "register" && role === "student" && studentStatus === "ALUMNI") {
      setValue("year", "Alumni")
    }
  }, [studentStatus, mode, role, setValue])

  // Pre-fill email for OAuth completion
  useEffect(() => {
    if (isOAuthCompletion && session?.user?.email) {
      setValue("email", session.user.email)
    }
  }, [isOAuthCompletion, session, setValue])

  // Auto-lock student status based on OAuth email domain
  useEffect(() => {
    if (isOAuthCompletion && session?.user?.email && role === "student") {
      const email = session.user.email.toLowerCase()
      // If OAuth email is not @ku.th, force ALUMNI status
      if (!email.endsWith("@ku.th")) {
        setStudentStatus("ALUMNI")
        // Also set year to "Alumni" immediately
        setValue("year", "Alumni", { shouldValidate: true })
      }
    }
  }, [isOAuthCompletion, session, role, setValue])

  // Handle session-based redirection after login
  useEffect(() => {
    if (awaitingSession && session?.user?.role) {
      setAwaitingSession(false)
      setIsLoading(false)

      // Redirect to callbackUrl if provided, otherwise to dashboard
      if (callbackUrl) {
        router.push(callbackUrl)
      } else {
        const normalizedRole = session.user.role.toLowerCase() as Role
        const userRoleConfig = ROLE_CONFIGS[normalizedRole]
        router.push(userRoleConfig?.redirectPath || `/${normalizedRole}/dashboard`)
      }
    }
  }, [session, awaitingSession, router, callbackUrl])

  const roleConfig = useMemo(() => ROLE_CONFIGS[role], [role])
  const Icon = roleConfig.icon

  const onSubmit = async (data: AuthFormData) => {
    // console.log("Form submitted with data:", data)
    setIsLoading(true)
    setError("")

    try {
      // Validate KU email for current students
      if (mode === "register" && role === "student" && studentStatus === "CURRENT") {
        if (!data.email.toLowerCase().endsWith("@ku.th")) {
          setError("Current students must use a KU email address (@ku.th). If you don't have access to your KU email, please register as Alumni instead and provide your transcript for verification.")
          setIsLoading(false)
          return
        }
      }

      // Validate transcript for alumni
      if (mode === "register" && role === "student" && studentStatus === "ALUMNI") {
        if (!selectedFile) {
          setError("Alumni must upload a transcript")
          setIsLoading(false)
          return
        }
      }

      // Validate evidence for company
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
          role: role, // Pass the role from URL
          redirect: false,
        })

        if (result?.error) {
          // Check if it's a role mismatch error
          if (result.error.startsWith("ROLE_MISMATCH:")) {
            const parts = result.error.split(":");
            const actualRole = parts[1]; // student or company
            const message = parts[2]; // The error message
            setActualUserRole(actualRole)
            setError(message)
            setIsLoading(false)
          } else if (result.error.startsWith("OAUTH_ACCOUNT:")) {
            // OAuth account trying to login with credentials
            const message = result.error.split(":")[1];
            setActualUserRole(null)
            setError(message)
            setIsLoading(false)
          } else {
            setActualUserRole(null)
            setError("Invalid email or password")
            setIsLoading(false)
          }
        } else {
          // Wait for session to be established before redirecting
          setAwaitingSession(true)
        }
      } else {
        // Registration
        console.log("Starting registration, isOAuthCompletion:", isOAuthCompletion)
        const formData = new FormData()
        formData.append("role", role)
        formData.append("email", data.email)

        // For OAuth completion, mark as OAuth and skip password
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

          if (selectedFile) {
            formData.append("transcript", selectedFile)
          }
        } else {
          formData.append("companyName", data.companyName!)
          formData.append("address", data.address!)
          formData.append("website", data.website || "")
          formData.append("description", data.description!)
          formData.append("phone", data.phone!)

          if (selectedFile) {
            formData.append("evidence", selectedFile)
          }
          // formData.append("year", data.year!.toString())
        }



        const response = await fetch("/api/register", {
          method: "POST",
          body: formData,
        })

        const responseText = await response.text()

        let result;
        try {
          result = JSON.parse(responseText)
        } catch (jsonError) {
          setError(`Server returned invalid response. Status: ${response.status}`)
          console.log(`Server returned invalid response when registering: ${jsonError}`)
          return
        }

        if (!response.ok) {
          setError(result.error || "Registration failed")
        } else {
          // For OAuth users, update session and redirect
          if (isOAuthCompletion) {
            console.log("OAuth registration complete, updating session...")

            // Show completion state
            setIsCompletingRegistration(true)
            setError("") // Clear any errors

            // Wait for database transaction to commit (reduce to 500ms)
            await new Promise(resolve => setTimeout(resolve, 500))

            // Update session to fetch fresh user data with role
            await update()

            // Navigate to dashboard
            router.push(result.redirectTo)
          } else {
            // Auto-login after registration for credentials users
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
      // Build callback URL
      const callbackUrl = mode === "register"
        ? `/register/complete/${role}`
        : roleConfig.redirectPath

      // Directly trigger Google OAuth flow
      // The prompt: "select_account" in provider config will force Google to show account picker
      // No need to sign out - Google will handle account selection
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
      // For registration, pass role to skip role selection page
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
      // Register the files with the form for validation
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
                  Not your account? Click "Use a different Google account" below the email field.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>
              <div className="flex flex-col gap-2">
                <p>{error}</p>
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
          // Filter out password errors for OAuth completion
          const filteredErrors = isOAuthCompletion
            ? Object.entries(errors).filter(([field]) => field !== 'password' && field !== 'confirmPassword')
            : Object.entries(errors);

          // Find the first error and display it
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
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
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
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  className="mt-1 bg-gray-50"
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                )}
              </div>

              {mode === "register" && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className="mt-1 bg-gray-50"
                    placeholder="Confirm your password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              )}
            </>
          )}

          {mode === "register" && (
            <>
              {role === "student" ? (
                <>
                  {/* Student Status Selection */}
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
                    {/* Show locked message for non-KU OAuth emails */}
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
                      <SelectTrigger className="mt-1 bg-gray-50">
                        <SelectValue placeholder="Select faculty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Software and Knowledge Engineering (SKE)">
                          Software and Knowledge Engineering (SKE)
                        </SelectItem>
                        <SelectItem value="Computer Engineering (CPE)">
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
                      <SelectTrigger className="mt-1 bg-gray-50">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentStatus === "CURRENT" ? (
                          // Current students: Only show year 1-8
                          [1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              Year {year}
                            </SelectItem>
                          ))
                        ) : (
                          // Alumni: Only show "Alumni" option
                          <SelectItem value="Alumni">
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
                      {...register("companyName")}
                      className="mt-1 bg-gray-50"
                      placeholder="Enter company name"
                    />
                    {errors.companyName && (
                      <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      {...register("address")}
                      className="mt-1 bg-gray-50"
                      rows={3}
                      placeholder="Enter company address"
                    />
                    {errors.address && (
                      <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="website">Website (Optional)</Label>
                    <Input
                      id="website"
                      type="url"
                      {...register("website")}
                      className="mt-1 bg-gray-50"
                      placeholder="https://example.com"
                    />
                    {errors.website && (
                      <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      className="mt-1 bg-gray-50"
                      rows={4}
                      placeholder="Describe your company..."
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
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
                    <Label htmlFor="evidence">Company Evidence Document (Required)</Label>
                    <div className="mt-1 flex items-center space-x-2 bg-gray-50">
                      <Input
                        id="evidence"
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
                      <p className="text-sm text-red-600 mt-1">
                        Company evidence document is required
                      </p>
                    )}
                    {errors.evidence && (
                      <p className="text-sm text-red-600 mt-1">{errors.evidence.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Upload documents like business license, registration certificate, or other proof of company legitimacy
                    </p>
                  </div>

                  {/* <div>
                    <Label htmlFor="year">Founded Year</Label>
                    <Input
                      id="year"
                      type="number"
                      {...register("year", { valueAsNumber: true })}
                      className="mt-1 bg-gray-50"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                    {errors.year && (
                      <p className="text-sm text-red-600 mt-1">{errors.year.message}</p>
                    )}
                  </div> */}
                </>
              )}
            </>
          )}

          <Button
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

          {/* Only show Google OAuth for non-admin roles */}
          {role !== "admin" && (
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
      </CardContent>
    </Card>
  )
}
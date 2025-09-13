// components/auth/AuthForm.tsx
"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { companyRegisterSchema, loginSchema, studentRegisterSchema } from "@/lib/validations"
import { AuthFormData, UserRole } from "@/types/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building, GraduationCap, Upload } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

interface AuthFormProps {
  role: UserRole
  mode: "login" | "register"
}

export function AuthForm({ role, mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [awaitingSession, setAwaitingSession] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const schema = mode === "login" 
    ? loginSchema 
    : role === "student" 
      ? studentRegisterSchema 
      : companyRegisterSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AuthFormData>({
    resolver: zodResolver(schema),
  })


  // Handle session-based redirection after login
  useEffect(() => {
    if (awaitingSession && session?.user?.role) {
      setAwaitingSession(false)
      setIsLoading(false)
      router.push(`/${session.user.role}/dashboard`)
    }
  }, [session, awaitingSession, router])

  const config = useMemo(() => {
    return role === "student" 
      ? {
          color: "green",
          icon: GraduationCap,
          title: "Student",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          buttonColor: "bg-green-600 hover:bg-green-700",
          inputColor: "bg-gray-50"
        }
      : {
          color: "orange", 
          icon: Building,
          title: "Company",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200", 
          buttonColor: "bg-orange-600 hover:bg-orange-700",
          inputColor: "bg-gray-50"
        }
  }, [role])
  const Icon = config.icon

  const onSubmit = async (data: AuthFormData) => {
    console.log("Form submitted with data:", data)
    setIsLoading(true)
    setError("")

    try {
      if (mode === "login") {
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        })

        if (result?.error) {
          setError("Invalid email or password")
          setIsLoading(false)
        } else {
          // Wait for session to be established before redirecting
          setAwaitingSession(true)
        }
      } else {
        // Registration
        const formData = new FormData()
        formData.append("role", role)
        formData.append("email", data.email)
        formData.append("password", data.password!)
        formData.append("confirmPassword", data.confirmPassword!)

        if (role === "student") {
          formData.append("studentId", data.studentId!)
          formData.append("name", data.name!)
          formData.append("faculty", data.faculty!)
          formData.append("year", data.year!.toString())
          formData.append("phone", data.phone!)
          
          if (selectedFile) {
            formData.append("transcript", selectedFile)
          }
        } else {
          formData.append("companyName", data.companyName!)
          formData.append("address", data.address!)
          formData.append("website", data.website || "")
          formData.append("description", data.description!)
          formData.append("phone", data.phone!)
          formData.append("year", data.year!.toString())
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
          // Auto-login after registration
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
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true)
    try {
      await signIn("google", { 
        callbackUrl: `/${role}/dashboard`,
        redirect: true 
      })
    } catch (error) {
      setError("Google sign-in failed")
      setIsLoading(false)
    }
  }, [role])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }, [])

  return (
    <Card className={`w-full max-w-md ${config.bgColor} ${config.borderColor}`}>
      <CardHeader className="text-center">
        <div className={`w-16 h-16 bg-${config.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-8 h-8 text-${config.color}-600`} />
        </div>
        <CardTitle className="text-2xl">
          {mode === "login" ? "Login" : "Create Account"} as {config.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit, () => {
          setError("Please fix the form errors before submitting")
        })} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className={`mt-1 ${config.inputColor}`}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              className={`mt-1 ${config.inputColor}`}
            />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {mode === "register" && (
            <>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  className={`mt-1 ${config.inputColor}`}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {role === "student" ? (
                <>
                  <div>
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      {...register("studentId")}
                      className={`mt-1 ${config.inputColor}`}
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
                      className={`mt-1 ${config.inputColor}`}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="faculty">Faculty</Label>
                    <Select onValueChange={(value) => setValue("faculty", value)}>
                      <SelectTrigger className={`mt-1 ${config.inputColor}`}>
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
                    <Select onValueChange={(value) => setValue("year", value === "Alumni" ? value : parseInt(value))}>
                      <SelectTrigger className={`mt-1 ${config.inputColor}`}>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            Year {year}
                          </SelectItem>
                        ))}
                        <SelectItem value="Alumni">
                          Alumni
                        </SelectItem>
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
                      className={`mt-1 ${config.inputColor}`}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="transcript">Transcript (Optional)</Label>
                    <div className={`mt-1 flex items-center space-x-2 ${config.inputColor}`}>
                      <Input
                        id="transcript"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Label 
                        htmlFor="transcript" 
                        className="flex items-center justify-center w-full h-10 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {selectedFile ? selectedFile.name : "Choose file"}
                      </Label>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      {...register("companyName")}
                      className="mt-1"
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
                      className="mt-1"
                      rows={3}
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
                      className="mt-1"
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
                      className="mt-1"
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
                      className="mt-1"
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="year">Founded Year</Label>
                    <Input
                      id="year"
                      type="number"
                      {...register("year", { valueAsNumber: true })}
                      className="mt-1"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                    {errors.year && (
                      <p className="text-sm text-red-600 mt-1">{errors.year.message}</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          <Button
            type="submit"
            className={`w-full ${config.buttonColor}`}
            disabled={isLoading}
          >
            {isLoading 
              ? awaitingSession 
                ? "Authenticating..." 
                : "Loading..." 
              : mode === "login" 
                ? "Sign In" 
                : "Create Account"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
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
        </form>

        <div className="mt-6 text-center">
          {mode === "login" ? (
            <p className="text-sm">
              Don&apos;t have an account?{" "}
              <a 
                href={`/register/${role}`} 
                className={`text-${config.color}-600 hover:text-${config.color}-500 font-medium`}
              >
                Sign up
              </a>
            </p>
          ) : (
            <p className="text-sm">
              Already have an account?{" "}
              <a 
                href={`/login/${role}`} 
                className={`text-${config.color}-600 hover:text-${config.color}-500 font-medium`}
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
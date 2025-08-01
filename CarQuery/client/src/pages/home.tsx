"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useLocation } from "wouter"
import { useMutation } from "@tanstack/react-query"
import { insertRegistrationSchema, type InsertRegistration } from "@shared/schema"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, User, Car, UserCheck, Phone, CreditCard, ArrowLeft } from "lucide-react"
import { useState, useEffect, useMemo, useCallback, memo, Suspense } from "react"
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form"

// Skeleton Loading Component
function FormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Skeleton */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 w-80 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>

            {/* Progress Bar Skeleton */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-32 bg-gray-200 rounded mt-1 animate-pulse"></div>
            </div>
          </div>

          {/* Form Skeleton */}
          <Card className="bg-white rounded-2xl shadow-xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Form Sections Skeleton */}
                {[1, 2, 3].map((section) => (
                  <div key={section} className="border-b border-gray-200 pb-6">
                    <div className="flex items-center mb-4">
                      <div className="h-5 w-5 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2].map((field) => (
                        <div key={field} className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Submit Button Skeleton */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="h-16 w-full bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Memoized Owner Section Component
const OwnerSection = memo(function OwnerSection({
  register,
  errors,
  setValue,
  getFieldValidationState,
  getInputClassName,
  formatPhoneNumber,
}: {
  register: UseFormRegister<InsertRegistration>
  errors: FieldErrors<InsertRegistration>
  setValue: UseFormSetValue<InsertRegistration>
  getFieldValidationState: (fieldName: string) => string
  getInputClassName: (fieldName: string) => string
  formatPhoneNumber: (value: string) => string
}) {
  return (
    <div className="border-b border-gray-200 pb-4 sm:pb-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Owner Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
              Owner's Full Name *
            </Label>
            {getFieldValidationState("ownerName") === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {getFieldValidationState("ownerName") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <Input
            id="ownerName"
            placeholder="Enter owner's full name"
            className={getInputClassName("ownerName")}
            {...register("ownerName")}
          />
          {errors.ownerName && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.ownerName.message}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ownerContact" className="text-sm font-medium text-gray-700">
              Owner's Contact Number *
            </Label>
            {getFieldValidationState("ownerContact") === "success" && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            {getFieldValidationState("ownerContact") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="ownerContact"
              placeholder="Enter 10-digit phone number"
              className={`${getInputClassName("ownerContact")} pl-10`}
              {...register("ownerContact", {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  if (formatted !== e.target.value) {
                    setValue("ownerContact", formatted)
                  }
                },
              })}
              maxLength={11}
            />
          </div>
          {errors.ownerContact && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.ownerContact.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// Memoized Vehicle Section Component
const VehicleSection = memo(function VehicleSection({
  register,
  errors,
  setValue,
  getFieldValidationState,
  getInputClassName,
}: {
  register: UseFormRegister<InsertRegistration>
  errors: FieldErrors<InsertRegistration>
  setValue: UseFormSetValue<InsertRegistration>
  getFieldValidationState: (fieldName: string) => string
  getInputClassName: (fieldName: string) => string
}) {
  return (
    <div className="border-b border-gray-200 pb-4 sm:pb-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <Car className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vehicle Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="carModel" className="text-sm font-medium text-gray-700">
              Car Name/Model *
            </Label>
            {getFieldValidationState("carModel") === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {getFieldValidationState("carModel") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <Input
            id="carModel"
            placeholder="e.g., Honda Civic, Toyota Corolla"
            className={getInputClassName("carModel")}
            {...register("carModel")}
          />
          {errors.carModel && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.carModel.message}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="regNumber" className="text-sm font-medium text-gray-700">
              Registration Number *
            </Label>
            {getFieldValidationState("regNumber") === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {getFieldValidationState("regNumber") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="regNumber"
              placeholder="e.g., ABC-1234 or AB12-CD3456"
              className={`${getInputClassName("regNumber")} pl-10 uppercase`}
              {...register("regNumber", {
                onChange: (e) => {
                  setValue("regNumber", e.target.value.toUpperCase())
                },
              })}
            />
          </div>
          {errors.regNumber && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.regNumber.message}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="seats" className="text-sm font-medium text-gray-700">
            Number of Seats
          </Label>
          <Select onValueChange={(value) => setValue("seats", Number.parseInt(value))} defaultValue="5">
            <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500 rounded-lg py-3">
              <SelectValue placeholder="Select seats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Seats</SelectItem>
              <SelectItem value="4">4 Seats</SelectItem>
              <SelectItem value="5">5 Seats</SelectItem>
              <SelectItem value="7">7 Seats</SelectItem>
              <SelectItem value="8">8+ Seats</SelectItem>
            </SelectContent>
          </Select>
          {errors.seats && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.seats.message}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">CNG-Powered Vehicle?</Label>
          <RadioGroup
            onValueChange={(value) => setValue("cngPowered", value === "true")}
            defaultValue="false"
            className="flex space-x-6 pt-2"
          >
            <div className="flex items-center space-x-2 p-2 rounded-lg border-2 border-transparent hover:border-gray-200 transition-colors">
              <RadioGroupItem value="true" id="cng-yes" />
              <Label htmlFor="cng-yes" className="cursor-pointer">Yes (CNG)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg border-2 border-transparent hover:border-gray-200 transition-colors">
              <RadioGroupItem value="false" id="cng-no" />
              <Label htmlFor="cng-no" className="cursor-pointer">No (Petrol/Diesel)</Label>
            </div>
          </RadioGroup>
          {errors.cngPowered && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.cngPowered.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// Memoized Driver Section Component
const DriverSection = memo(function DriverSection({
  register,
  errors,
  setValue,
  getFieldValidationState,
  getInputClassName,
  formatPhoneNumber,
}: {
  register: UseFormRegister<InsertRegistration>
  errors: FieldErrors<InsertRegistration>
  setValue: UseFormSetValue<InsertRegistration>
  getFieldValidationState: (fieldName: string) => string
  getInputClassName: (fieldName: string) => string
  formatPhoneNumber: (value: string) => string
}) {
  return (
    <div className="pb-4 sm:pb-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Driver Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="driverName" className="text-sm font-medium text-gray-700">
              Driver's Full Name *
            </Label>
            {getFieldValidationState("driverName") === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {getFieldValidationState("driverName") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <Input
            id="driverName"
            placeholder="Enter driver's full name"
            className={getInputClassName("driverName")}
            {...register("driverName")}
          />
          {errors.driverName && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.driverName.message}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="driverContact" className="text-sm font-medium text-gray-700">
              Driver's Contact Number *
            </Label>
            {getFieldValidationState("driverContact") === "success" && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            {getFieldValidationState("driverContact") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="driverContact"
              placeholder="Enter 10-digit phone number"
              className={`${getInputClassName("driverContact")} pl-10`}
              {...register("driverContact", {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  if (formatted !== e.target.value) {
                    setValue("driverContact", formatted)
                  }
                },
              })}
              maxLength={11}
            />
          </div>
          {errors.driverContact && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.driverContact.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// Main Home Component with all optimizations
function HomeContent() {
  const { toast } = useToast()
  const [location, setLocation] = useLocation()
  const [formProgress, setFormProgress] = useState(0)
  const [completedFields, setCompletedFields] = useState(new Set<string>())

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<InsertRegistration>({
    resolver: zodResolver(insertRegistrationSchema),
    mode: "onBlur", // Changed from onChange to onBlur for better performance
    defaultValues: {
      ownerName: "",
      ownerContact: "",
      carModel: "",
      regNumber: "",
      seats: 5,
      cngPowered: false,
      driverName: "",
      driverContact: "",
    },
  })

  // Watch all form values for progress calculation
  const watchedValues = watch()

  // Memoize form completion progress calculation
  const { progress, completed } = useMemo(() => {
    const requiredFields = ["ownerName", "ownerContact", "carModel", "regNumber", "driverName", "driverContact"]
    const completedFieldsList = requiredFields.filter((field) => {
      const value = watchedValues[field as keyof InsertRegistration]
      return value && String(value).trim().length > 0
    })

    return {
      progress: (completedFieldsList.length / requiredFields.length) * 100,
      completed: new Set(completedFieldsList),
    }
  }, [watchedValues])

  // Update state only when values actually change
  useEffect(() => {
    setCompletedFields(completed)
    setFormProgress(progress)
  }, [completed, progress])

  // Memoize helper functions
  const formatPhoneNumber = useCallback((value: string) => {
    const phoneNumber = value.replace(/\D/g, "")
    if (phoneNumber.length <= 10) {
      return phoneNumber.replace(/(\d{5})(\d{5})/, "$1-$2")
    }
    return phoneNumber
  }, [])

  const getFieldValidationState = useCallback(
    (fieldName: string) => {
      const hasError = errors[fieldName as keyof typeof errors]
      const isTouched = touchedFields[fieldName as keyof typeof touchedFields]
      const isCompleted = completedFields.has(fieldName)

      if (hasError && isTouched) return "error"
      if (isCompleted) return "success"
      if (isTouched) return "warning"
      return "default"
    },
    [errors, touchedFields, completedFields],
  )

  const getInputClassName = useCallback(
    (fieldName: string) => {
      const state = getFieldValidationState(fieldName)
      const baseClass = "border-2 rounded-lg py-3 px-4 transition-all duration-200"

      switch (state) {
        case "error":
          return `${baseClass} border-red-500 focus:border-red-600 bg-red-50`
        case "success":
          return `${baseClass} border-green-500 focus:border-green-600 bg-green-50`
        case "warning":
          return `${baseClass} border-yellow-500 focus:border-yellow-600 bg-yellow-50`
        default:
          return `${baseClass} border-gray-300 focus:border-blue-500`
      }
    },
    [getFieldValidationState],
  )

  const submitRegistration = useMutation({
    mutationFn: async (data: InsertRegistration) => {
      const response = await apiRequest("POST", "/api/registrations", data)
      return response.json()
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success!",
        description: "Registration submitted successfully!",
      })

      // Create a secure session token for results page access
      const sessionToken = data.sessionToken
      const ownerName = variables.ownerName

      // Store session data securely (expires in 10 minutes)
      sessionStorage.setItem("registrationSession", JSON.stringify({
        token: sessionToken,
        ownerName: ownerName,
        timestamp: Date.now(),
        expires: Date.now() + (10 * 60 * 1000) // 10 minutes
      }))

      // Redirect to results page with secure token
      setLocation(`/results?token=${sessionToken}`)
      reset()
    },
    onError: (error) => {
      console.error("Submission error:", error)
      toast({
        title: "Error",
        description: "Failed to submit registration. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = useCallback(
    (data: InsertRegistration) => {
      console.log("Form data:", data)
      submitRegistration.mutate(data)
    },
    [submitRegistration],
  )

  // Memoize form summary data
  const formSummaryData = useMemo(() => {
    const fields = [
      { key: "ownerName", label: "Owner Name" },
      { key: "ownerContact", label: "Owner Contact" },
      { key: "carModel", label: "Car Model" },
      { key: "regNumber", label: "Registration No." },
      { key: "driverName", label: "Driver Name" },
      { key: "driverContact", label: "Driver Contact" },
    ]

    return fields.map((field) => ({
      ...field,
      completed: completedFields.has(field.key),
    }))
  }, [completedFields])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">CarConnect</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Rent Your Car</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">Register your vehicle to start earning by renting it to travelers</p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto px-4 sm:px-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Form Progress</span>
                <Badge variant={formProgress === 100 ? "default" : "secondary"} className="text-xs">
                  {Math.round(formProgress)}% Complete
                </Badge>
              </div>
              <Progress value={formProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{completedFields.size} of 6 required fields completed</p>
            </div>
          </div>

          {/* Form Container */}
          <Card className="max-w-4xl mx-auto shadow-xl card-mobile">
            <CardContent className="p-4 sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Form sections with optimized components */}
                <OwnerSection
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  getFieldValidationState={getFieldValidationState}
                  getInputClassName={getInputClassName}
                  formatPhoneNumber={formatPhoneNumber}
                />

                <VehicleSection
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  getFieldValidationState={getFieldValidationState}
                  getInputClassName={getInputClassName}
                />

                <DriverSection
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  getFieldValidationState={getFieldValidationState}
                  getInputClassName={getInputClassName}
                  formatPhoneNumber={formatPhoneNumber}
                />

                {/* Form Summary & Submit */}
                <div className="pt-4 sm:pt-6 border-t border-gray-200">

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || submitRegistration.isPending || formProgress < 100}
                    className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 transform ${
                      formProgress === 100
                        ? "bg-green-600 hover:bg-green-700 hover:scale-[1.02] focus:ring-4 focus:ring-green-200"
                        : "bg-gray-400 cursor-not-allowed"
                    } text-white btn-mobile input-mobile`}
                  >
                    {isSubmitting || submitRegistration.isPending ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm sm:text-base">Submitting Registration...</span>
                      </div>
                    ) : formProgress === 100 ? (
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-sm sm:text-base">Submit Registration</span>
                      </div>
                    ) : (
                      <span className="text-sm sm:text-base">Complete Form to Submit</span>
                    )}
                  </Button>

                  {formProgress < 100 && (
                    <p className="text-center text-xs sm:text-sm text-gray-500 mt-2">
                      {6 - completedFields.size} more field{6 - completedFields.size !== 1 ? "s" : ""} required
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Main export with Suspense wrapper
export default function Home() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}
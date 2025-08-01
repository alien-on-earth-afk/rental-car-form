"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useLocation } from "wouter"
import { useMutation } from "@tanstack/react-query"
import { insertRideRequestSchema, type InsertRideRequest } from "@shared/schema"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, User, MapPin, Calendar, Car, MessageSquare, Phone, ArrowLeft } from "lucide-react"
import { useState, useEffect, useMemo, useCallback, memo, Suspense } from "react"
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form"

// Form validation schema
const rideRequestSchema = z.object({
  passengerName: z.string().min(2, "Name must be at least 2 characters"),
  passengerContact: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[0-9+\-\s()]+$/, "Please enter a valid phone number"),
  pickupLocation: z.string().min(3, "Pickup location is required"),
  dropoffLocation: z.string().min(3, "Drop-off location is required"),
  rideDate: z.string().min(1, "Ride date is required"),
  rideTime: z.string().min(1, "Ride time is required"),
  passengers: z.number().min(1, "Number of passengers is required").max(8, "Maximum 8 passengers"),
  prefersCNG: z.boolean(),
  specialRequests: z.string().optional(),
})

type RideRequest = z.infer<typeof rideRequestSchema>

// Skeleton Loading Component
function FormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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
                {[1, 2, 3, 4].map((section) => (
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

// Memoized Personal Info Section Component
const PersonalInfoSection = memo(function PersonalInfoSection({
  register,
  errors,
  setValue,
  getFieldValidationState,
  getInputClassName,
  formatPhoneNumber,
}: {
  register: UseFormRegister<RideRequest>
  errors: FieldErrors<RideRequest>
  setValue: UseFormSetValue<RideRequest>
  getFieldValidationState: (fieldName: string) => string
  getInputClassName: (fieldName: string) => string
  formatPhoneNumber: (value: string) => string
}) {
  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center mb-4">
        <User className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="passengerName" className="text-sm font-medium text-gray-700">
              Full Name *
            </Label>
            {getFieldValidationState("passengerName") === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {getFieldValidationState("passengerName") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <Input
            id="passengerName"
            placeholder="Enter your full name"
            className={getInputClassName("passengerName")}
            {...register("passengerName")}
          />
          {errors.passengerName && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.passengerName.message}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="passengerContact" className="text-sm font-medium text-gray-700">
              Phone Number *
            </Label>
            {getFieldValidationState("passengerContact") === "success" && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            {getFieldValidationState("passengerContact") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="passengerContact"
              placeholder="Enter 10-digit phone number"
              className={`${getInputClassName("passengerContact")} pl-10`}
              {...register("passengerContact", {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  if (formatted !== e.target.value) {
                    setValue("passengerContact", formatted)
                  }
                },
              })}
              maxLength={11}
            />
          </div>
          {errors.passengerContact && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.passengerContact.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// Memoized Location Section Component
const LocationSection = memo(function LocationSection({
  register,
  errors,
  getFieldValidationState,
  getInputClassName,
}: {
  register: UseFormRegister<RideRequest>
  errors: FieldErrors<RideRequest>
  getFieldValidationState: (fieldName: string) => string
  getInputClassName: (fieldName: string) => string
}) {
  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center mb-4">
        <MapPin className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Trip Details</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pickupLocation" className="text-sm font-medium text-gray-700">
              Pickup Location *
            </Label>
            {getFieldValidationState("pickupLocation") === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {getFieldValidationState("pickupLocation") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <Input
            id="pickupLocation"
            placeholder="e.g., Delhi Airport, Mumbai Station"
            className={getInputClassName("pickupLocation")}
            {...register("pickupLocation")}
          />
          {errors.pickupLocation && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.pickupLocation.message}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="dropoffLocation" className="text-sm font-medium text-gray-700">
              Drop-off Location *
            </Label>
            {getFieldValidationState("dropoffLocation") === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {getFieldValidationState("dropoffLocation") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <Input
            id="dropoffLocation"
            placeholder="e.g., Goa Beach, Manali Hill Station"
            className={getInputClassName("dropoffLocation")}
            {...register("dropoffLocation")}
          />
          {errors.dropoffLocation && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.dropoffLocation.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// Memoized Preferences Section Component
const PreferencesSection = memo(function PreferencesSection({
  register,
  errors,
  setValue,
  getFieldValidationState,
  getInputClassName,
}: {
  register: UseFormRegister<RideRequest>
  errors: FieldErrors<RideRequest>
  setValue: UseFormSetValue<RideRequest>
  getFieldValidationState: (fieldName: string) => string
  getInputClassName: (fieldName: string) => string
}) {
  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center mb-4">
        <Car className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Car Preferences</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rideDate" className="text-sm font-medium text-gray-700">
              Ride Date *
            </Label>
            {getFieldValidationState("rideDate") === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {getFieldValidationState("rideDate") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="rideDate"
              type="date"
              className={`${getInputClassName("rideDate")} pl-10`}
              {...register("rideDate")}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
          {errors.rideDate && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.rideDate.message}</p>
            </div>
          )}
        </div>
         <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rideTime" className="text-sm font-medium text-gray-700">
              Ride Time *
            </Label>
            {getFieldValidationState("rideTime") === "success" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {getFieldValidationState("rideTime") === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="rideTime"
              type="time"
              className={`${getInputClassName("rideTime")} pl-10`}
              {...register("rideTime")}
            />
          </div>
          {errors.rideTime && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">{errors.rideTime.message}</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
            <Label htmlFor="passengers" className="text-sm font-medium text-gray-700">
              Number of Passengers *
            </Label>
            <Input
              id="passengers"
              type="number"
              placeholder="Enter number of passengers"
              className={getInputClassName("passengers")}
              {...register("passengers", {
                valueAsNumber: true,
                min: 1,
                max: 8
              })}
              min="1"
              max="8"
            />
            {errors.passengers && (
              <div className="flex items-center space-x-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-600">{errors.passengers.message}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="prefersCNG" className="text-sm font-medium text-gray-700">
              Prefers CNG
            </Label>
            <input
              id="prefersCNG"
              type="checkbox"
              className="h-5 w-5 text-green-500 border-gray-300 rounded focus:ring-green-500"
              {...register("prefersCNG")}
            />
          </div>
      </div>
    </div>
  )
})

// Memoized Additional Request Section Component
const AdditionalRequestSection = memo(function AdditionalRequestSection({
  register,
}: {
  register: UseFormRegister<RideRequest>
}) {
  return (
    <div className="pb-6">
      <div className="flex items-center mb-4">
        <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Additional Requests</h3>
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialRequests" className="text-sm font-medium text-gray-700">
          Special Requirements (Optional)
        </Label>
        <Textarea
          id="specialRequests"
          placeholder="Please mention if you are looking for any particular car model, have special requirements, or any other requests..."
          className="border-2 border-gray-300 focus:border-green-500 rounded-lg py-3 px-4 min-h-[100px] resize-none"
          {...register("specialRequests")}
        />
        <p className="text-xs text-gray-500">
          Examples: "Need a car with GPS", "Prefer automatic transmission", "Looking for a specific car model"
        </p>
      </div>
    </div>
  )
})

// Main Ride Request Component
function RideContent() {
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
  } = useForm<RideRequest>({
    resolver: zodResolver(rideRequestSchema),
    mode: "onBlur",
    defaultValues: {
      passengerName: "",
      passengerContact: "",
      pickupLocation: "",
      dropoffLocation: "",
      rideDate: "",
      rideTime: "",
      passengers: 1,
      prefersCNG: false,
      specialRequests: "",
    },
  })

  // Watch all form values for progress calculation
  const watchedValues = watch()

  // Memoize form completion progress calculation
  const { progress, completed } = useMemo(() => {
    const requiredFields = ["passengerName", "passengerContact", "pickupLocation", "dropoffLocation", "rideDate", "rideTime", "passengers"]
    const completedFieldsList = requiredFields.filter((field) => {
      const value = watchedValues[field as keyof RideRequest]
      return value && String(value).trim().length > 0
    })

    return {
      progress: (completedFieldsList.length / requiredFields.length) * 100,
      completed: new Set(completedFieldsList),
    }
  }, [watchedValues])

  // Update state only when values actually change
  useEffect(() => {
    const completedSize = completed.size
    const currentSize = completedFields.size

    if (completedSize !== currentSize || formProgress !== progress) {
      setCompletedFields(completed)
      setFormProgress(progress)
    }
  }, [progress, completed.size])

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
          return `${baseClass} border-gray-300 focus:border-green-500`
      }
    },
    [getFieldValidationState],
  )

  const submitRideRequest = useMutation({
    mutationFn: async (data: RideRequest) => {
      const response = await apiRequest("POST", "/api/ride-requests", data)
      return response.json()
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success!",
        description: "Ride request submitted successfully!",
      })

      // Create a secure session token for results page access
      const sessionToken = data.sessionToken || crypto.randomUUID()
      const passengerName = variables.passengerName

      // Store session data securely (expires in 10 minutes)
      sessionStorage.setItem("rideRequestSession", JSON.stringify({
        token: sessionToken,
        name: passengerName,
        timestamp: Date.now(),
        expires: Date.now() + (10 * 60 * 1000) // 10 minutes
      }))

      // Redirect to results page with secure token
      setLocation(`/ride-results?token=${sessionToken}`)
      reset()
    },
    onError: (error) => {
      console.error("Submission error:", error)
      toast({
        title: "Error",
        description: "Failed to submit ride request. Please try again.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = useCallback(
    (data: RideRequest) => {
      console.log("Ride request data:", data)
      submitRideRequest.mutate(data)
    },
    [submitRideRequest],
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Request a Ride</h2>
            <p className="text-gray-600 mb-4">Tell us about your trip and we'll find the perfect car for you</p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Form Progress</span>
                <Badge variant={formProgress === 100 ? "default" : "secondary"}>
                  {Math.round(formProgress)}% Complete
                </Badge>
              </div>
              <Progress value={formProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{completedFields.size} of 7 required fields completed</p>
            </div>
          </div>

          {/* Form Container */}
          <Card className="bg-white rounded-2xl shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Form sections with optimized components */}
                <PersonalInfoSection
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  getFieldValidationState={getFieldValidationState}
                  getInputClassName={getInputClassName}
                  formatPhoneNumber={formatPhoneNumber}
                />

                <LocationSection
                  register={register}
                  errors={errors}
                  getFieldValidationState={getFieldValidationState}
                  getInputClassName={getInputClassName}
                />

                <PreferencesSection
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  getFieldValidationState={getFieldValidationState}
                  getInputClassName={getInputClassName}
                />

                <AdditionalRequestSection
                  register={register}
                />

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={isSubmitting || submitRideRequest.isPending || formProgress < 100}
                    className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 transform ${
                      formProgress === 100
                        ? "bg-green-600 hover:bg-green-700 hover:scale-[1.02] focus:ring-4 focus:ring-green-200"
                        : "bg-gray-400 cursor-not-allowed"
                    } text-white`}
                  >
                    {isSubmitting || submitRideRequest.isPending ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting Request...</span>
                      </div>
                    ) : formProgress === 100 ? (
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Submit Ride Request</span>
                      </div>
                    ) : (
                      <span>Complete All Fields</span>
                    )}
                  </Button>

                  {formProgress < 100 && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      {7 - completedFields.size} more field{7 - completedFields.size !== 1 ? "s" : ""} required
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
export default function Ride() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <RideContent />
    </Suspense>
  )
}
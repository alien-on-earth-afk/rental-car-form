
"use client"

import { useLocation, Link } from "wouter"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, MessageCircle, Clock, ArrowLeft, Sparkles, AlertTriangle } from "lucide-react"
import { apiRequest } from "@/lib/queryClient"

interface SessionData {
  token: string
  name: string
  timestamp: number
  expires: number
}

export default function RideResults() {
  const [location, setLocation] = useLocation()
  const [name, setName] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    setMounted(true)
    validateAccess()
  }, [])

  const validateAccess = async () => {
    try {
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search)
      const tokenFromUrl = urlParams.get("token")

      if (!tokenFromUrl) {
        setAccessDenied(true)
        setIsValidating(false)
        return
      }

      // Get session data from sessionStorage
      const sessionDataStr = sessionStorage.getItem("rideRequestSession")
      if (!sessionDataStr) {
        setAccessDenied(true)
        setIsValidating(false)
        return
      }

      const sessionData: SessionData = JSON.parse(sessionDataStr)

      // Check if session has expired
      if (Date.now() > sessionData.expires) {
        sessionStorage.removeItem("rideRequestSession")
        setAccessDenied(true)
        setIsValidating(false)
        return
      }

      // Check if tokens match
      if (sessionData.token !== tokenFromUrl) {
        setAccessDenied(true)
        setIsValidating(false)
        return
      }

      // Validate token with server
      try {
        const response = await apiRequest("POST", "/api/validate-ride-session", {
          token: tokenFromUrl
        })
        const result = await response.json()

        if (!result.valid) {
          setAccessDenied(true)
          setIsValidating(false)
          return
        }

        // Session is valid - set name and invalidate the token
        setName(sessionData.name)
        
        // Clear session data after successful validation (one-time use)
        sessionStorage.removeItem("rideRequestSession")
        
        // Remove token from URL for security
        window.history.replaceState({}, document.title, "/ride-results")
        
        setIsValidating(false)
      } catch (error) {
        console.error("Token validation error:", error)
        setAccessDenied(true)
        setIsValidating(false)
      }

    } catch (error) {
      console.error("Access validation error:", error)
      setAccessDenied(true)
      setIsValidating(false)
    }
  }

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hi! I just submitted a ride request and would like to get in touch regarding my request. Name: ${name}`
    )
    window.open(`https://wa.me/447466907446?text=${message}`, "_blank")
  }

  const handleBackToHome = () => {
    setLocation("/")
  }

  // Loading state
  if (!mounted || isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating access...</p>
        </div>
      </div>
    )
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100">
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">CarConnect</h1>
              </div>
            </div>
          </div>
        </nav>

        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
                <div className="bg-red-500 rounded-full p-4">
                  <AlertTriangle className="h-12 w-12 text-white" />
                </div>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-xl text-gray-600 mb-6">
                This page can only be accessed after successfully submitting a ride request
              </p>
            </div>

            <Card className="bg-white rounded-2xl shadow-xl mb-8">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">
                      Invalid or Expired Access
                    </h3>
                    <p className="text-red-700 leading-relaxed">
                      The results page can only be accessed immediately after submitting a ride request. 
                      Sessions expire after 10 minutes for security purposes.
                    </p>
                  </div>

                  <Button
                    onClick={handleBackToHome}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300"
                    size="lg"
                  >
                    Go to Home Page
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Success state (only shown if access is valid)
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
              <Button
                variant="ghost"
                onClick={handleBackToHome}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping"></div>
              <div className="relative bg-green-500 rounded-full p-4">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <Badge className="bg-green-100 text-green-800 border-green-200 mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Ride Request Successful
            </Badge>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Thank you, {name}!
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Your ride request has been submitted successfully
            </p>
          </div>

          {/* Main Card */}
          <Card className="bg-white rounded-2xl shadow-xl mb-8">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* Status Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-3">
                    <Clock className="h-6 w-6 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-800">What happens next?</h3>
                  </div>
                  <p className="text-green-700 leading-relaxed">
                    We're now searching for the perfect car for your trip. Our team will match you 
                    with available vehicles and contact you within <strong>2 hours</strong> with options and pricing.
                  </p>
                </div>

                {/* Contact Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Need immediate assistance?
                  </h4>
                  <p className="text-gray-600 mb-6">
                    If you have any questions about your ride request or need to make changes, 
                    our support team is here to help.
                  </p>
                  
                  {/* WhatsApp CTA Button */}
                  <Button
                    onClick={handleWhatsAppContact}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    size="lg"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Contact Support on WhatsApp
                  </Button>
                  
                  <p className="text-sm text-gray-500 mt-3">
                    Available 24/7 for your convenience
                  </p>
                </div>

                {/* Additional Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                  <h4 className="text-md font-semibold text-blue-800 mb-2">
                    Important Reminders
                  </h4>
                  <ul className="text-blue-700 text-sm space-y-2 text-left">
                    <li>• Keep your phone accessible for confirmation calls</li>
                    <li>• We'll send you car options with pricing details</li>
                    <li>• Payment is made directly to the car owner</li>
                    <li>• Trip details and driver info will be shared once confirmed</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="text-center space-y-4">
            <Button
              variant="outline"
              onClick={handleBackToHome}
              className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium py-2 px-6 rounded-lg transition-all duration-200"
            >
              Submit Another Request
            </Button>
            
            <p className="text-sm text-gray-500">
              Thank you for choosing CarConnect for your travel needs
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

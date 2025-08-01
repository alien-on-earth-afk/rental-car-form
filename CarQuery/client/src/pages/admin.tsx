"use client"

import type React from "react"

import { useState, useEffect, lazy, Suspense, useCallback } from "react"
import { Link } from "wouter"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"
import type { Registration, RideRequest } from "@shared/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Car, Calendar, TrendingUp, ChevronLeft, ChevronRight, Menu, X, Download } from "lucide-react"

// Lazy load charts to improve initial load time
const BarChart = lazy(() => import("recharts").then((module) => ({ default: module.BarChart })))
const Bar = lazy(() => import("recharts").then((module) => ({ default: module.Bar })))
const XAxis = lazy(() => import("recharts").then((module) => ({ default: module.XAxis })))
const YAxis = lazy(() => import("recharts").then((module) => ({ default: module.YAxis })))
const CartesianGrid = lazy(() => import("recharts").then((module) => ({ default: module.CartesianGrid })))
const Tooltip = lazy(() => import("recharts").then((module) => ({ default: module.Tooltip })))
const ResponsiveContainer = lazy(() => import("recharts").then((module) => ({ default: module.ResponsiveContainer })))

// Chart Loading Skeleton
const ChartSkeleton = () => (
  <div className="w-full h-[300px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-400">Loading chart...</div>
  </div>
)

// Custom debounced search hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  return debouncedValue
}

// Mobile Registration Card Component
const MobileRegistrationCard = ({ registration }: { registration: Registration }) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{registration.ownerName}</h3>
            <p className="text-sm text-gray-600">{registration.ownerContact}</p>
          </div>
          <Badge variant={registration.cngPowered ? "default" : "secondary"}>
            {registration.cngPowered ? "CNG" : "Regular"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Car Model:</span>
            <p className="font-medium">{registration.carModel}</p>
          </div>
          <div>
            <span className="text-gray-500">Seats:</span>
            <p className="font-medium">{registration.seats}</p>
          </div>
          <div>
            <span className="text-gray-500">Registration:</span>
            <p className="font-medium">{registration.regNumber || "N/A"}</p>
          </div>
          <div>
            <span className="text-gray-500">Driver:</span>
            <p className="font-medium">{registration.driverName}</p>
          </div>
        </div>

        <div className="pt-2 border-t text-xs text-gray-500">
          {new Date(registration.createdAt).toLocaleDateString()} at{" "}
          {new Date(registration.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Mobile Ride Request Card Component
const MobileRideRequestCard = ({ rideRequest }: { rideRequest: RideRequest }) => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{rideRequest.passengerName}</h3>
            <p className="text-sm text-gray-600">{rideRequest.passengerContact}</p>
          </div>
          <Badge variant={rideRequest.prefersCNG ? "default" : "secondary"}>
            {rideRequest.prefersCNG ? "Prefers CNG" : "Any Vehicle"}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">From:</span>
            <p className="font-medium">{rideRequest.pickupLocation}</p>
          </div>
          <div>
            <span className="text-gray-500">To:</span>
            <p className="font-medium">{rideRequest.dropoffLocation}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-gray-500">Date:</span>
              <p className="font-medium">{rideRequest.rideDate}</p>
            </div>
            <div>
              <span className="text-gray-500">Time:</span>
              <p className="font-medium">{rideRequest.rideTime}</p>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Passengers:</span>
            <p className="font-medium">{rideRequest.passengers}</p>
          </div>
          {rideRequest.specialRequests && (
            <div>
              <span className="text-gray-500">Special Requests:</span>
              <p className="font-medium text-xs">{rideRequest.specialRequests}</p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t text-xs text-gray-500">
          {new Date(rideRequest.createdAt).toLocaleDateString()} at{" "}
          {new Date(rideRequest.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"registrations" | "ride-requests">("registrations")
  const { toast } = useToast()

  // Debounced search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("POST", "/api/admin/login", { password })
      return response.json()
    },
    onSuccess: (data) => {
      if (data.success && data.token) {
        setAuthToken(data.token)
        setIsAuthenticated(true)
        setIsLoginOpen(false)
        setPassword("")
        // Store token in localStorage for persistence
        localStorage.setItem("admin_token", data.token)
        localStorage.setItem("token_expiry", (Date.now() + data.expiresIn * 1000).toString())
        toast({
          title: "Success",
          description: "Logged in successfully!",
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid password!",
        variant: "destructive",
      })
    },
  })

  // Check for existing token on component mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    const expiry = localStorage.getItem("token_expiry")

    if (token && expiry && Date.now() < Number.parseInt(expiry)) {
      setAuthToken(token)
      setIsAuthenticated(true)
    } else {
      // Clear expired token
      localStorage.removeItem("admin_token")
      localStorage.removeItem("token_expiry")
    }
  }, [])

  // Paginated registrations query with authentication
  const { data: registrationsData, isLoading } = useQuery<{
    success: boolean
    data: Registration[]
    total: number
    page: number
    totalPages: number
  }>({
    queryKey: ["/api/registrations", currentPage, pageSize, debouncedSearchTerm, filterBy, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: debouncedSearchTerm,
        filter: filterBy,
        sortBy,
      })

      const response = await fetch(`/api/registrations?${params}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token expired, clear auth state
          setIsAuthenticated(false)
          setAuthToken(null)
          localStorage.removeItem("admin_token")
          localStorage.removeItem("token_expiry")
          throw new Error("Authentication failed")
        }
        throw new Error("Failed to fetch registrations")
      }

      return response.json()
    },
    enabled: isAuthenticated && !!authToken,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
  })

  // Analytics query (separate from paginated data)
  const { data: analyticsData } = useQuery<{ success: boolean; data: any }>({
    queryKey: ["/api/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/analytics", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch analytics")
      return response.json()
    },
    enabled: isAuthenticated && !!authToken,
    staleTime: 1000 * 60 * 2, // 2 minutes cache for analytics
  })

  // Ride requests query
  const [rideRequestsPage, setRideRequestsPage] = useState(1);
  const [rideRequestsSearch, setRideRequestsSearch] = useState('');
  const [rideRequestsFilter, setRideRequestsFilter] = useState('all');

  const {
    data: rideRequestsData,
    isLoading: rideRequestsLoading,
    error: rideRequestsError,
    refetch: refetchRideRequests
  } = useQuery({
    queryKey: ['rideRequests', rideRequestsPage, rideRequestsSearch, rideRequestsFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: rideRequestsPage.toString(),
        limit: '20',
        search: rideRequestsSearch,
        filter: rideRequestsFilter
      });

      const response = await fetch(`/api/ride-requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ride requests');
      }

      const result = await response.json();
      console.log('Ride requests API response:', result);
      return result;
    },
    enabled: !!authToken,
    retry: 3,
    refetchOnWindowFocus: false
  });

  // Ride analytics query
  const { data: rideAnalyticsData } = useQuery<{ success: boolean; data: any }>({
    queryKey: ["/api/ride-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/ride-analytics", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch ride analytics")
      return response.json()
    },
    enabled: isAuthenticated && !!authToken && activeTab === "ride-requests",
    staleTime: 1000 * 60 * 2, // 2 minutes cache for analytics
  })

  const registrations = registrationsData?.data || []
  const rideRequests = rideRequestsData?.data || []
  const totalPages = activeTab === "registrations" ? (registrationsData?.totalPages || 1) : (rideRequestsData?.totalPages || 1)

  // Use server-side analytics data
  const analytics = analyticsData?.data || null
  const rideAnalytics = rideAnalyticsData?.data || null

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, filterBy, sortBy])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate(password)
  }

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    setAuthToken(null)
    localStorage.removeItem("admin_token")
    localStorage.removeItem("token_expiry")
    setIsMobileMenuOpen(false)
    toast({
      title: "Logged out",
      description: "Successfully logged out of admin panel",
    })
  }, [toast])

  const handleDownloadCSV = async () => {
    try {
      const type = activeTab === "registrations" ? "registrations" : "ride-requests"
      const response = await fetch(`/api/download-csv?type=${type}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to download CSV")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${type.replace('-', '_')}_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "CSV file downloaded successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download CSV file",
        variant: "destructive",
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Car Portal</h1>
              </div>
              <div className="hidden sm:flex items-center space-x-4">
                <Button variant="ghost" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Admin Panel
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Home
                  </Button>
                </Link>
              </div>
              <div className="sm:hidden flex items-center">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Login Form */}
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-bold text-center">Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="border-2 border-gray-300 focus:border-blue-500 rounded-lg py-3"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Car Portal</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-4">
              <Button variant="ghost" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Admin Panel
              </Button>
              <Link href="/">
                <Button variant="ghost" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                  Home
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="destructive" size="sm">
                Logout
              </Button>
            </div>

            {/* Mobile Navigation Button */}
            <div className="sm:hidden flex items-center">
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-3">
                <Button variant="ghost" className="justify-start text-blue-600 hover:text-blue-500">
                  Admin Panel
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="justify-start w-full text-gray-500 hover:text-gray-700">
                    Home
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="destructive" className="justify-start">
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Admin Content */}
      <div className="py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Admin Header */}
          <Card className="mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h2>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage vehicle registrations and ride requests</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <span className="text-sm text-gray-500">
                      Total Records: <span className="font-semibold text-blue-600">
                        {activeTab === "registrations" ? registrations.length : rideRequests.length}
                      </span>
                    </span>
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <Button
                        onClick={handleDownloadCSV}
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                      >
                        <Download className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Download CSV</span>
                      </Button>
                      <Button onClick={handleLogout} variant="destructive" size="sm" className="sm:hidden">
                        Logout
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <Button
                    onClick={() => setActiveTab("registrations")}
                    variant={activeTab === "registrations" ? "default" : "ghost"}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    Car Rentals ({analytics?.totalRegistrations || 0})
                  </Button>
                  <Button
                    onClick={() => setActiveTab("ride-requests")}
                    variant={activeTab === "ride-requests" ? "default" : "ghost"}
                    size="sm"
                    className="flex-1 sm:flex-none"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Ride Requests ({rideAnalytics?.totalRideRequests || 0})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          {((activeTab === "registrations" && analytics) || (activeTab === "ride-requests" && rideAnalytics)) && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              {activeTab === "registrations" && analytics ? (
                <>
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center">
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        <div className="ml-2 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Total Registrations</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">{analytics.totalRegistrations}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center">
                        <Car className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        <div className="ml-2 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">CNG Powered</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">{analytics.cngPowered}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round((analytics.cngPowered / analytics.totalRegistrations) * 100)}% of total
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center">
                        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                        <div className="ml-2 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Unique Car Models</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">{analytics.uniqueCars}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center">
                        <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                        <div className="ml-2 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">This Week</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">
                            {analytics.registrationsByDate.reduce((sum, day) => sum + day.count, 0)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center">
                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        <div className="ml-2 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Total Ride Requests</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">{rideAnalytics?.totalRideRequests}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center">
                        <Car className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        <div className="ml-2 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Prefers CNG</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">{rideAnalytics?.cngPreferred}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round((rideAnalytics?.cngPreferred / rideAnalytics?.totalRideRequests) * 100)}% of total
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center">
                        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                        <div className="ml-2 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Avg Passengers</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">{rideAnalytics?.avgPassengers}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center">
                        <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                        <div className="ml-2 sm:ml-4">
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Popular Pickups</p>
                          <p className="text-lg sm:text-2xl font-bold text-gray-900">{rideAnalytics?.popularPickups?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Charts Section - Hidden on mobile, shown on tablet+ */}
          {analytics && (
            <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Registrations (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<ChartSkeleton />}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.registrationsByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Suspense>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Car Models</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<ChartSkeleton />}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.carModelChart} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="model" type="category" width={80} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filter Section */}
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, car model, registration number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cars</SelectItem>
                      <SelectItem value="cng">CNG Powered</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Latest First</SelectItem>
                      <SelectItem value="owner">Owner Name</SelectItem>
                      <SelectItem value="car">Car Model</SelectItem>
                      <SelectItem value="seats">Seat Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(searchTerm || filterBy !== "all") && (
                <div className="mt-4 text-sm text-gray-600">
                  Showing {registrations.length} registrations {searchTerm && `matching "${searchTerm}"`}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">
                {activeTab === "registrations" ? "Registration Records" : "Ride Request Records"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {(activeTab === "registrations" ? isLoading : rideRequestsLoading) ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    Loading {activeTab === "registrations" ? "registrations" : "ride requests"}...
                  </div>
                </div>
              ) : (activeTab === "registrations" ? registrations.length : rideRequests.length) === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || filterBy !== "all" 
                    ? `No matching ${activeTab === "registrations" ? "registrations" : "ride requests"} found` 
                    : `No ${activeTab === "registrations" ? "registrations" : "ride requests"} found`}
                </div>
              ) : (
                <>
                  {/* Mobile View - Card Layout */}
                  <div className="block sm:hidden">
                    {activeTab === "registrations" 
                      ? registrations.map((registration) => (
                          <MobileRegistrationCard key={registration.id} registration={registration} />
                        ))
                      : rideRequests.map((rideRequest) => (
                          <MobileRideRequestCard key={rideRequest.id} rideRequest={rideRequest} />
                        ))
                    }
                  </div>

                  {/* Desktop View - Table Layout */}
                  <div className="hidden sm:block overflow-x-auto">
                    {activeTab === "registrations" ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Owner Name</TableHead>
                            <TableHead>Owner Contact</TableHead>
                            <TableHead>Car Model</TableHead>
                            <TableHead>Registration</TableHead>
                            <TableHead>Seats</TableHead>
                            <TableHead>CNG</TableHead>
                            <TableHead>Driver Name</TableHead>
                            <TableHead>Driver Contact</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {registrations.map((registration) => (
                            <TableRow key={registration.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{registration.ownerName}</TableCell>
                              <TableCell>{registration.ownerContact}</TableCell>
                              <TableCell>{registration.carModel}</TableCell>
                              <TableCell>{registration.regNumber || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{registration.seats}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={registration.cngPowered ? "default" : "secondary"}>
                                  {registration.cngPowered ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell>{registration.driverName}</TableCell>
                              <TableCell>{registration.driverContact || "N/A"}</TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {new Date(registration.createdAt).toLocaleDateString()} at{" "}
                                {new Date(registration.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Passenger Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Passengers</TableHead>
                            <TableHead>CNG Preference</TableHead>
                            <TableHead>Special Requests</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rideRequestsData?.success && rideRequestsData?.data?.length > 0 ? (
                          rideRequestsData.data.map((rideRequest) => (
                            <TableRow key={rideRequest.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{rideRequest.passengerName}</TableCell>
                              <TableCell>{rideRequest.passengerContact}</TableCell>
                              <TableCell className="max-w-32 truncate">{rideRequest.pickupLocation}</TableCell>
                              <TableCell className="max-w-32 truncate">{rideRequest.dropoffLocation}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{rideRequest.rideDate}</div>
                                  <div className="text-gray-500">{rideRequest.rideTime}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{rideRequest.passengers}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={rideRequest.prefersCNG ? "default" : "secondary"}>
                                  {rideRequest.prefersCNG ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-32 truncate">
                                {rideRequest.specialRequests || "None"}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {new Date(rideRequest.createdAt).toLocaleDateString()} at{" "}
                                {new Date(rideRequest.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              {rideRequestsLoading ? "Loading ride requests..." : 
                               rideRequestsError ? "Error loading ride requests" :
                               "No ride requests found"}
                            </TableCell>
                          </TableRow>
                        )}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t space-y-4 sm:space-y-0">
                      <div className="text-sm text-gray-700 order-2 sm:order-1">
                        Page {currentPage} of {totalPages}
                      </div>

                      <div className="flex items-center space-x-2 order-1 sm:order-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Previous</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <span className="hidden sm:inline mr-1">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="order-3">
                        <Select
                          value={pageSize.toString()}
                          onValueChange={(value) => setPageSize(Number.parseInt(value))}
                        >
                          <SelectTrigger className="w-20 sm:w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
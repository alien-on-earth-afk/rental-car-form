"use client"

import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, MapPin, Users, Clock, Shield, Star, ArrowRight, CheckCircle2 } from "lucide-react"

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">CarConnect</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-6 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
                  <span className="block xl:inline">Your Journey</span>{' '}
                  <span className="block text-green-600 xl:inline">Starts Here</span>
                </h1>
                <p className="mt-3 text-sm text-gray-500 sm:mt-5 sm:text-base md:text-lg lg:text-xl sm:max-w-xl sm:mx-auto md:mt-5 lg:mx-0">
                  Whether you want to rent a car for your adventure or need a ride to your destination, 
                  we've got you covered with reliable and affordable transportation solutions.
                </p>
                <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="/rent">
                      <Button className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 sm:text-base md:py-4 md:text-lg md:px-10">
                        <Car className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Rent your Car
                      </Button>
                    </Link>
                  </div>
                  <div className="rounded-md shadow">
                    <Link href="/ride">
                      <Button variant="outline" className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 sm:text-base md:py-4 md:text-lg md:px-10">
                        <MapPin className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Need a Ride
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-0 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
            <Star className="h-3 w-3 mr-1" />
            Trusted Car Sharing Platform
          </Badge>

          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Perfect
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text"> Journey </span>
            Awaits
          </h2>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          </p>

          {/* Main Action Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* Ride Card */}
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200">
              <CardContent className="p-8 text-center">
                <div className="bg-green-500 rounded-full p-4 w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-8 w-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">Need a Ride?</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Find the perfect car for your trip. Choose from a variety of vehicles 
                  and enjoy comfortable, affordable rides.
                </p>

                <ul className="text-left space-y-2 mb-6 text-sm text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    Multiple car options (5 & 7 seaters)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    Flexible pickup & drop-off
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    One-way & round-trip options
                  </li>
                </ul>

                <Link href="/ride">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 group-hover:shadow-lg">
                    Request a Ride
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            

            
            {/* Rent Card */}
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200">
              <CardContent className="p-8 text-center">
                <div className="bg-blue-500 rounded-full p-4 w-16 h-16 mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Car className="h-8 w-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">Own a Car?</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Earn money by renting out your vehicle to travelers. 
                  It's safe, secure, and profitable.
                </p>

                <ul className="text-left space-y-2 mb-6 text-sm text-gray-700">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mr-2" />
                    Earn passive income
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mr-2" />
                    Verified renters only
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 mr-2" />
                    Rent multiple cars
                  </li>
                </ul>

                <Link href="/rent">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 group-hover:shadow-lg">
                    Rent Your Car
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Safe & Secure</h4>
              <p className="text-sm text-gray-600">All users are verified and vehicles are insured for your peace of mind.</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-orange-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">24/7 Support</h4>
              <p className="text-sm text-gray-600">Our support team is available round the clock to assist you.</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Community Driven</h4>
              <p className="text-sm text-gray-600">Join many of satisfied users in our growing community.</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">X</div>
                <div className="text-gray-600">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">X</div>
                <div className="text-gray-600">Cars Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
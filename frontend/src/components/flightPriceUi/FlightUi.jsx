import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plane, Users, Calendar, Clock, MapPin } from 'lucide-react';
import AirportAutocomplete from "../AirportAutocomplete/AirportAutocomplete";
import { predictFlightFare } from '../../services/api';
import toast, { Toaster } from "react-hot-toast";

// Mapping from human-readable time to numeric values
const TIME_MAPPING = {
  'Early_Morning': 0,
  'Morning': 8,
  'Afternoon': 12,
  'Evening': 14,
  'Night': 18,
  'Late_Night': 22
};

// Mapping for cities (if your autocomplete returns a full name, you can convert if needed)
const CITY_MAPPING = {
  "CHHATRAPATI S MAHARAJ": "Mumbai",
  "SUBHAS CHANDRA BOSE": "Kolkata",
  "INDIRA GANDHI INTL": "Delhi",
  "Kempegowda International": "Bangalore",
  "Rajiv Gandhi International": "Hyderabad",
  "Chennai International": "Chennai"
};

// Define the order of cities expected by the backend
const ALL_CITIES = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai'];

// Make sure the order matches the backend FEATURE_ORDER for airlines
const ALL_AIRLINES = ["AirAsia", "Air_India", "GO_FIRST", "Indigo", "SpiceJet", "Vistara"];

// Classes as expected by the backend
const ALL_CLASSES = ['Business', 'Economy'];

// For stops, our backend expects: stops_one, stops_two_or_more, stops_zero.
// We map select values "0", "1", "2+" to these keys.
const STOPS_MAPPING = {
  "0": "zero",
  "1": "one",
  "2+": "two_or_more"
};
const ALL_STOPS = ['one', 'two_or_more', 'zero'];

export default function FlightFarePrediction() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      tripType: "oneWay",
      source_city: "",
      destination_city: "",
      departureDate: new Date(),
      airline: "SpiceJet",
      stops: "0", // "0" for Non-stop, "1" for 1 Stop, "2+" for 2+ Stops
      travelClass: "Economy",
      departureTime: "Morning",
      arrivalTime: "Evening",
      duration: 2
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null); // Reset previous result
      
      console.log("Form data submitted:", data);
      
      // Normalize city names using CITY_MAPPING if available
      const sourceCity = CITY_MAPPING[data.source_city] || data.source_city;
      const destCity = CITY_MAPPING[data.destination_city] || data.destination_city;

      // Calculate days left (ensure a minimum of 1)
      const daysLeft = Math.ceil((data.departureDate - new Date()) / (1000 * 60 * 60 * 24));
      
      // Build the payload's core numeric fields
      const payload = {
        days_left: daysLeft > 0 ? daysLeft : 1,
        duration: parseFloat(data.duration),
        departureTime: data.departureTime,       // Pass the original time string
        arrivalTime: data.arrivalTime,           // Pass the original time string
        source_city: sourceCity,
        destination_city: destCity,
        airline: data.airline,
        travelClass: data.travelClass,
        stops: data.stops,
        departureDate: data.departureDate        // Also include the date
      };

      console.log("Sending to API service:", payload);
      const prediction = await predictFlightFare(payload);
      
      if (prediction.status === "success") {
        setResult(`${prediction.currency}${prediction.price.toLocaleString()}`);
      } else {
        setError("Prediction error: " + (prediction.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Prediction failed:", error);
      setError("Prediction failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const tripType = watch("tripType");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" />
      
      {/* Header Card */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl border border-blue-100 mb-6 transform transition-all duration-500 hover:shadow-2xl">
        <h2 className="text-3xl font-bold text-blue-600 text-center mb-2 flex items-center justify-center">
          <Plane className="mr-2 text-blue-500" size={32} strokeWidth={2} />
          Predict Your Flight Fare
        </h2>
        <p className="text-gray-500 text-center">Enter your travel details to get an accurate fare prediction</p>
      </div>

      {/* Main Content */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl border border-blue-100">
        <div className="grid w-full grid-cols-2 bg-blue-50 rounded-lg p-1 gap-1 mb-6">
          <button
            type="button"
            className={`rounded-lg py-3 font-medium transition-all duration-300 ${
              tripType === "oneWay" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-transparent text-blue-600 hover:bg-blue-100"
            }`}
            onClick={() => setValue("tripType", "oneWay")}
          >
            One Way
          </button>
          <button
            type="button"
            className={`rounded-lg py-3 font-medium transition-all duration-300 ${
              tripType === "roundTrip" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-transparent text-blue-600 hover:bg-blue-100"
            }`}
            onClick={() => setValue("tripType", "roundTrip")}
          >
            Round Trip
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* From/To Cities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <MapPin className="mr-2 text-blue-500" size={18} />
                From
              </label>
              <div className="relative">
                <AirportAutocomplete
                  onSelect={(airport) => setValue("source_city", airport.city)}
                  value={watch("source_city")}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <MapPin className="mr-2 text-blue-500" size={18} />
                To
              </label>
              <div className="relative">
                <AirportAutocomplete
                  onSelect={(airport) => setValue("destination_city", airport.city)}
                  value={watch("destination_city")}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Date and Airline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <Calendar className="mr-2 text-blue-500" size={18} />
                Departure Date
              </label>
              <DatePicker
                selected={watch("departureDate")}
                onChange={(date) => setValue("departureDate", date)}
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                placeholderText="Select date"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <Plane className="mr-2 text-blue-500" size={18} />
                Airline <span className="text-red-500">*</span>
              </label>
              <select
                {...register("airline", { required: true })}
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                {ALL_AIRLINES.map((airline) => (
                  <option key={airline} value={airline}>
                    {airline.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {tripType === "roundTrip" && (
              <div className="space-y-2">
                <label className="block font-medium text-gray-700 flex items-center">
                  <Calendar className="mr-2 text-blue-500" size={18} />
                  Return Date
                </label>
                <DatePicker
                  selected={watch("returnDate")}
                  onChange={(date) => setValue("returnDate", date)}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  placeholderText="Select date"
                />
              </div>
            )}
          </div>

          {/* Class, Passengers, Duration, Stops */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Class</label>
              <select 
                {...register("travelClass")} 
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                {ALL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <Users className="mr-2 text-blue-500" size={18} />
                Passengers
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="9"
                  {...register("passengers")}
                  className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 pl-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <Clock className="mr-2 text-blue-500" size={18} />
                Duration (hours)
              </label>
              <input
                type="number"
                step="0.1"
                {...register("duration")}
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                placeholder="Flight duration"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Stops</label>
              <select 
                {...register("stops")} 
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                <option value="0">Non-stop</option>
                <option value="1">1 Stop</option>
                <option value="2+">2+ Stops</option>
              </select>
            </div>
          </div>

          {/* Departure/Arrival Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <Clock className="mr-2 text-blue-500" size={18} />
                Departure Time
              </label>
              <select 
                {...register("departureTime")} 
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                {Object.keys(TIME_MAPPING).map((label) => (
                  <option key={label} value={label}>
                    {label.replace(/_/g, ' ')} ({TIME_MAPPING[label]}:00)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <Clock className="mr-2 text-blue-500" size={18} />
                Arrival Time
              </label>
              <select 
                {...register("arrivalTime")} 
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                {Object.keys(TIME_MAPPING).map((label) => (
                  <option key={label} value={label}>
                    {label.replace(/_/g, ' ')} ({TIME_MAPPING[label]}:00)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center mt-8">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Predicting...
                </span>
              ) : (
                <span className="flex items-center">
                  Predict Fare
                  <Plane className="ml-2" size={20} />
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 animate-pulse">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="mt-8 pt-6 border-t border-blue-100">
            <h3 className="text-lg font-medium mb-4 text-blue-700">Predicted Fare</h3>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-inner">
              {/* Route Summary */}
              <div className="mb-4 p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <MapPin className="text-blue-500 mr-2" size={18} />
                    <span className="font-medium">{watch("source_city")}</span>
                  </div>
                  <Plane className="text-blue-500 mx-2" size={20} />
                  <div className="flex items-center">
                    <span className="font-medium">{watch("destination_city")}</span>
                    <MapPin className="text-blue-500 ml-2" size={18} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="text-blue-500 mr-1" size={14} />
                    <span>{watch("departureDate")?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="text-blue-500 mr-1" size={14} />
                    <span>{watch("duration")} hrs</span>
                  </div>
                  <div className="flex items-center">
                    <Plane className="text-blue-500 mr-1" size={14} />
                    <span>{watch("airline").replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </div>
              {/* Price Display */}
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Estimated price:</span>
                <span className="text-3xl font-bold text-blue-700">{result}</span>
              </div>
              <p className="mt-3 text-xs text-blue-500">
                * Prices may vary based on availability and other factors
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with shadow */}
      <div className="w-full max-w-4xl mt-6 px-4 py-3 text-center text-blue-500 text-sm">
        © {new Date().getFullYear()} Flight Fare Predictor | Get accurate estimates for your journey
      </div>
    </div>
  );
}
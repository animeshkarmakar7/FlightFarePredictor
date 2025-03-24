import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plane, Users } from 'lucide-react';
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
    <div className="min-h-screen  items-center justify-center bg-white text-gray-800 px-4">
      <Toaster position="top-center" />
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl border border-gray-200">
        <h2 className="text-3xl font-bold text-blue-600 text-center mb-6">
          Predict Your Fare ✈️
        </h2>
        <p className="text-gray-200 mt-2">Enter your travel details to predict the fare</p>
      </div>

      <div className="p-6">
        <div className="grid w-full grid-cols-2 bg-gray-800 rounded-lg p-1 gap-1 mb-6">
          <button
            type="button"
            className={`rounded-lg py-2 ${tripType === "oneWay" ? "bg-blue-600" : ""}`}
            onClick={() => setValue("tripType", "oneWay")}
          >
            One Way
          </button>
          <button
            type="button"
            className={`rounded-lg py-2 ${tripType === "roundTrip" ? "bg-blue-600" : ""}`}
            onClick={() => setValue("tripType", "roundTrip")}
          >
            Round Trip
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">From</label>
              <AirportAutocomplete
                onSelect={(airport) => setValue("source_city", airport.city)}
                value={watch("source_city")}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">To</label>
              <AirportAutocomplete
                onSelect={(airport) => setValue("destination_city", airport.city)}
                value={watch("destination_city")}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Departure Date</label>
              <DatePicker
                selected={watch("departureDate")}
                onChange={(date) => setValue("departureDate", date)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholderText="Select date"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">
                Airline <span className="text-red-500">*</span>
              </label>
              <select
                {...register("airline", { required: true })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium">Return Date</label>
                <DatePicker
                  selected={watch("returnDate")}
                  onChange={(date) => setValue("returnDate", date)}
                  className="w-full p-2 bg-gray-800 border-gray-700 rounded-lg text-white"
                  placeholderText="Select date"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Class</label>
              <select {...register("travelClass")} className="w-full p-2 bg-gray-800 border-gray-700 rounded-lg text-white">
                {ALL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Passengers</label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="9"
                  {...register("passengers")}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Duration (hours)</label>
              <input
                type="number"
                step="0.1"
                {...register("duration")}
                className="w-full p-2 bg-gray-800 border-gray-700 rounded-lg text-white"
                placeholder="Flight duration"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Stops</label>
              <select {...register("stops")} className="w-full p-2 bg-gray-800 border-gray-700 rounded-lg text-white">
                <option value="0">Non-stop</option>
                <option value="1">1 Stop</option>
                <option value="2+">2+ Stops</option>
              </select>
            </div>
          </div>

          {/* Departure Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Departure Time</label>
            <select 
              {...register("departureTime")} 
              className="w-full p-2 bg-gray-800 border-gray-700 rounded-lg text-white"
            >
              {Object.keys(TIME_MAPPING).map((label) => (
                <option key={label} value={label}>
                  {label.replace(/_/g, ' ')} ({TIME_MAPPING[label]})
                </option>
              ))}
            </select>
          </div>

          {/* Arrival Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Arrival Time</label>
            <select 
              {...register("arrivalTime")} 
              className="w-full p-2 bg-gray-800 border-gray-700 rounded-lg text-white"
            >
              {Object.keys(TIME_MAPPING).map((label) => (
                <option key={label} value={label}>
                  {label.replace(/_/g, ' ')} ({TIME_MAPPING[label]})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-3 rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Predicting..." : "Predict Fare"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8 pt-6 border-t border-gray-800">
            <h3 className="text-lg font-medium mb-4">Predicted Fare</h3>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Estimated price:</span>
                <span className="text-2xl font-bold text-green-400">{result}</span>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                * Prices may vary based on availability and other factors
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
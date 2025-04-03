import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Plane, Users, Calendar, Clock, MapPin, TrendingUp } from 'lucide-react';
import { predictFlightFare, predictFlightTrend } from '../../services/api';
import toast, { Toaster } from "react-hot-toast";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define all available cities
const ALL_CITIES = ['Mumbai', 'Kolkata', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];

// Define the order of cities expected by the backend
const BACKEND_CITY_MAPPING = {
  'Bangalore': 'Bangalore',
  'Chennai': 'Chennai',
  'Delhi': 'Delhi',
  'Hyderabad': 'Hyderabad',
  'Kolkata': 'Kolkata',
  'Mumbai': 'Mumbai'
};

// Make sure the order matches the backend FEATURE_ORDER for airlines
const ALL_AIRLINES = ["AirAsia", "Air_India", "GO_FIRST", "Indigo", "SpiceJet", "Vistara"];

// Classes as expected by the backend
const ALL_CLASSES = ['Business', 'Economy'];

// For stops, our backend expects: stops_one, stops_two_or_more, stops_zero.
const STOPS_MAPPING = {
  "0": "zero",
  "1": "one",
  "2+": "two_or_more"
};

export default function FlightFarePrediction() {
  const [result, setResult] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrendLoading, setIsTrendLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { register, handleSubmit, watch, setValue, getValues } = useForm({
    defaultValues: {
      tripType: "oneWay",
      source_city: "Mumbai",
      destination_city: "Delhi",
      departureDate: new Date(),
      airline: "SpiceJet",
      stops: "0",
      travelClass: "Economy",
      departureHour: "09",
      departureMinute: "00",
      departureAmPm: "AM",
      arrivalHour: "11",
      arrivalMinute: "00",
      arrivalAmPm: "AM",
      duration: 2
    },
  });

  // Watch for changes in departure time and duration to update arrival time
  const watchDepartureHour = watch("departureHour");
  const watchDepartureMinute = watch("departureMinute");
  const watchDepartureAmPm = watch("departureAmPm");
  const watchDuration = watch("duration");

  // Calculate arrival time based on departure time and duration
  const calculateArrivalTime = () => {
    const dHour = parseInt(watchDepartureHour);
    const dMinute = parseInt(watchDepartureMinute);
    const dAmPm = watchDepartureAmPm;
    const duration = parseFloat(watchDuration);

    // Convert to 24-hour format
    let hour24 = dAmPm === "PM" && dHour !== 12 ? dHour + 12 : dHour;
    if (dAmPm === "AM" && dHour === 12) hour24 = 0;

    // Calculate total minutes
    const totalMinutes = hour24 * 60 + dMinute + duration * 60;
    
    // Convert back to hours and minutes
    let newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = Math.floor(totalMinutes % 60);
    
    // Convert to 12-hour format
    const newAmPm = newHour >= 12 ? "PM" : "AM";
    newHour = newHour % 12;
    if (newHour === 0) newHour = 12;

    // Format the time values
    const formattedHour = newHour.toString().padStart(2, '0');
    const formattedMinute = newMinute.toString().padStart(2, '0');

    // Update the form values
    setValue("arrivalHour", formattedHour);
    setValue("arrivalMinute", formattedMinute);
    setValue("arrivalAmPm", newAmPm);
  };

  // Watch for changes that affect arrival time
  React.useEffect(() => {
    if (watchDepartureHour && watchDepartureMinute && watchDepartureAmPm && watchDuration) {
      calculateArrivalTime();
    }
  }, [watchDepartureHour, watchDepartureMinute, watchDepartureAmPm, watchDuration]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setIsTrendLoading(true);
      setError(null);
      setResult(null);
      setTrendData(null);
      
      // Calculate days left (ensure a minimum of 1)
      const daysLeft = Math.ceil((data.departureDate - new Date()) / (1000 * 60 * 60 * 24));
      
      // Format departure and arrival times
      const departureTime = `${data.departureHour}:${data.departureMinute} ${data.departureAmPm}`;
      const arrivalTime = `${data.arrivalHour}:${data.arrivalMinute} ${data.arrivalAmPm}`;
      
      // Map time to the categories that the backend expects
      const mapTimeToCategory = (timeStr) => {
        const [hours, minutes, ampm] = timeStr.split(/[: ]/);
        let hour = parseInt(hours);
        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        
        // Map to categories
        if (hour >= 0 && hour < 6) return "Early_Morning";
        if (hour >= 6 && hour < 12) return "Morning";
        if (hour >= 12 && hour < 16) return "Afternoon";
        if (hour >= 16 && hour < 19) return "Evening";
        if (hour >= 19 && hour < 22) return "Night";
        return "Late_Night";
      };
      
      // Build the payload
      const payload = {
        days_left: daysLeft > 0 ? daysLeft : 1,
        duration: parseFloat(data.duration),
        departureTime: mapTimeToCategory(departureTime),
        arrivalTime: mapTimeToCategory(arrivalTime),
        source_city: BACKEND_CITY_MAPPING[data.source_city],
        destination_city: BACKEND_CITY_MAPPING[data.destination_city],
        airline: data.airline,
        travelClass: data.travelClass,
        stops: data.stops,
        departureDate: data.departureDate,
      };

      // Get both prediction and trend data
      const [prediction, trendResponse] = await Promise.all([
        predictFlightFare(payload),
        predictFlightTrend(payload)
      ]);
      
      if (prediction.status === "success") {
        setResult({
          price: prediction.price,
          currency: prediction.currency,
          route: `${data.source_city} to ${data.destination_city}`,
          date: data.departureDate.toLocaleDateString(),
          time: `${departureTime} - ${arrivalTime}`,
          airline: data.airline.replace(/_/g, ' '),
          duration: data.duration,
          class: data.travelClass,
          stops: data.stops === "0" ? "Non-stop" : data.stops === "1" ? "1 Stop" : "2+ Stops"
        });
      } else {
        setError("Prediction error: " + (prediction.error || "Unknown error"));
      }

      if (trendResponse.status === "success") {
        setTrendData(trendResponse);
      }
    } catch (error) {
      console.error("Prediction failed:", error);
      setError("Prediction failed: " + error.message);
    } finally {
      setIsLoading(false);
      setIsTrendLoading(false);
    }
  };

  // Prepare chart data for visualization
  const prepareChartData = () => {
    if (!trendData) return null;

    const historicalDates = trendData.historical.map(item => item.date);
    const forecastDates = trendData.forecast.map(item => item.date);
    
    const historicalPrices = trendData.historical.map(item => item.price);
    const forecastPrices = trendData.forecast.map(item => item.price);

    return {
      labels: [...historicalDates, ...forecastDates],
      datasets: [
        {
          label: 'Flight Price (₹)',
          data: [...historicalPrices, ...forecastPrices],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.1,
          borderWidth: 2,
          pointBackgroundColor: (context) => {
            return context.dataIndex < historicalDates.length 
              ? 'rgba(16, 185, 129, 0.8)' 
              : 'rgba(239, 68, 68, 0.8)';
          },
          pointRadius: (context) => {
            return context.dataIndex < historicalDates.length ? 3 : 5;
          }
        }
      ]
    };
  };

  const tripType = watch("tripType");

  // Generate hours options for time selection
  const hoursOptions = [];
  for (let i = 1; i <= 12; i++) {
    hoursOptions.push(i.toString().padStart(2, '0'));
  }

  // Generate minutes options for time selection
  const minutesOptions = [];
  for (let i = 0; i < 60; i += 5) {
    minutesOptions.push(i.toString().padStart(2, '0'));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" />
      
      {/* Header Card */}
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl border border-blue-100 mb-6 transform transition-all duration-500 hover:shadow-2xl">
        <h2 className="text-3xl font-bold text-blue-600 text-center mb-2 flex items-center justify-center">
          <Plane className="mr-2 text-blue-500" size={32} strokeWidth={2} />
          Flight Fare Predictor
        </h2>
        <p className="text-gray-500 text-center">Get accurate fare predictions and price trends for your journey</p>
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
              <select
                {...register("source_city", { required: true })}
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                {ALL_CITIES.map((city) => (
                  <option key={`source-${city}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <MapPin className="mr-2 text-blue-500" size={18} />
                To
              </label>
              <select
                {...register("destination_city", { required: true })}
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                {ALL_CITIES.map((city) => (
                  <option key={`dest-${city}`} value={city}>
                    {city}
                  </option>
                ))}
              </select>
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
                minDate={new Date()}
              />
            </div>

            <div className="space-y-2">
              <label className="block font-medium text-gray-700 flex items-center">
                <Plane className="mr-2 text-blue-500" size={18} />
                Airline
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
          </div>

          {/* Departure Time */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700 flex items-center">
              <Clock className="mr-2 text-blue-500" size={18} />
              Departure Time
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                {...register("departureHour")}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                {hoursOptions.map((hour) => (
                  <option key={`dep-hour-${hour}`} value={hour}>{hour}</option>
                ))}
              </select>
              <select
                {...register("departureMinute")}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                {minutesOptions.map((minute) => (
                  <option key={`dep-min-${minute}`} value={minute}>{minute}</option>
                ))}
              </select>
              <select
                {...register("departureAmPm")}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700 flex items-center">
              <Clock className="mr-2 text-blue-500" size={18} />
              Duration (hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              {...register("duration")}
              className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
              placeholder="Flight duration"
            />
          </div>

          {/* Arrival Time (Calculated) */}
          <div className="space-y-2">
            <label className="block font-medium text-gray-700 flex items-center">
              <Clock className="mr-2 text-blue-500" size={18} />
              Arrival Time (Calculated)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                readOnly
                value={watch("arrivalHour")}
                className="bg-gray-100 border border-blue-200 rounded-lg p-3 focus:outline-none transition-all duration-300"
              />
              <input
                type="text"
                readOnly
                value={watch("arrivalMinute")}
                className="bg-gray-100 border border-blue-200 rounded-lg p-3 focus:outline-none transition-all duration-300"
              />
              <input
                type="text"
                readOnly
                value={watch("arrivalAmPm")}
                className="bg-gray-100 border border-blue-200 rounded-lg p-3 focus:outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Class and Stops */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block font-medium text-gray-700">Class</label>
              <select 
                {...register("travelClass")} 
                className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-all duration-300"
              >
                {ALL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
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
                  Predict Fare & Trends
                  <TrendingUp className="ml-2" size={20} />
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
            <h3 className="text-lg font-medium mb-4 text-blue-700">Flight Details</h3>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-inner">
              {/* Route Summary */}
              <div className="mb-4 p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <MapPin className="text-blue-500 mr-2" size={18} />
                    <span className="font-medium">{result.route.split(' to ')[0]}</span>
                  </div>
                  <Plane className="text-blue-500 mx-2" size={20} />
                  <div className="flex items-center">
                    <span className="font-medium">{result.route.split(' to ')[1]}</span>
                    <MapPin className="text-blue-500 ml-2" size={18} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="text-blue-500 mr-1" size={14} />
                    <span>{result.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="text-blue-500 mr-1" size={14} />
                    <span>{result.time}</span>
                  </div>
                  <div className="flex items-center">
                    <Plane className="text-blue-500 mr-1" size={14} />
                    <span>{result.airline}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-1">⏱️</span>
                    <span>{result.duration} hours</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-1">🪑</span>
                    <span>{result.class}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-500 mr-1">✈️</span>
                    <span>{result.stops}</span>
                  </div>
                </div>
              </div>
              
              {/* Price Display */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-blue-700 font-medium">Predicted price:</span>
                <span className="text-3xl font-bold text-blue-700">
                  {result.currency}{result.price.toLocaleString()}
                </span>
              </div>

              {/* Price Trend Chart */}
              {isTrendLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-blue-500">Loading price trends...</div>
                </div>
              ) : trendData && prepareChartData() ? (
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-3 text-blue-700 flex items-center">
                    <TrendingUp className="mr-2" size={20} />
                    Price Trend Analysis
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="h-64">
                      <Line 
                        data={prepareChartData()} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: false,
                              ticks: {
                                callback: (value) => `₹${value}`
                              }
                            }
                          },
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: (context) => `Price: ₹${context.raw.toLocaleString()}`
                              }
                            },
                            legend: {
                              display: false
                            }
                          }
                        }} 
                      />
                    </div>
                    <div className="mt-4 flex justify-center space-x-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm">Historical Prices</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm">Future Prediction</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      * Future prices are predictions based on historical trends
                    </p>
                  </div>
                </div>
              ) : null}
              
              <p className="mt-3 text-xs text-blue-500">
                * Prices may vary based on availability and other factors
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="w-full max-w-4xl mt-6 px-4 py-3 text-center text-blue-500 text-sm">
        © {new Date().getFullYear()} Flight Fare Predictor | Get accurate estimates for your journey
      </div>
    </div>
  );
}


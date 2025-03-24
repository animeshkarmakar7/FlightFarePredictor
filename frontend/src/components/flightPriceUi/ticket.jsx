import React, { useState, useEffect } from "react";
import { MapPin, Plane, Calendar, Clock } from "lucide-react";
import { useForm } from 'react-hook-form';
import AirportAutocomplete from "../AirportAutocomplete/AirportAutocomplete";
import { predictFlightFare } from '../../services/api';

const Ticket = ({ result, formData }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds delay
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen flex-col space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Calculating best fare...</p>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-blue-100">
      <h3 className="text-lg font-medium mb-4 text-blue-700">Predicted Fare</h3>
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-inner">
        {/* Route Summary */}
        <div className="mb-4 p-4 bg-white rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <MapPin className="text-blue-500 mr-2" size={18} />
              <span className="font-medium">{formData.source_city}</span>
            </div>
            <Plane className="text-blue-500 mx-2" size={20} />
            <div className="flex items-center">
              <span className="font-medium">{formData.destination_city}</span>
              <MapPin className="text-blue-500 ml-2" size={18} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="text-blue-500 mr-1" size={14} />
              <span>{formData.departureDate?.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className="text-blue-500 mr-1" size={14} />
              <span>{formData.duration} hrs</span>
            </div>
            <div className="flex items-center">
              <Plane className="text-blue-500 mr-1" size={14} />
              <span>{formData.airline.replace(/_/g, ' ')}</span>
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
  );
};

export default Ticket;
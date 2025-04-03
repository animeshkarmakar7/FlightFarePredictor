import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const TIME_MAPPING = {
  'Early_Morning': 0,
  'Morning': 8,
  'Afternoon': 12,
  'Evening': 14,
  'Night': 18,
  'Late_Night': 22
};

const CITY_MAPPING = {
  "CHHATRAPATI S MAHARAJ": "Mumbai",
  "SUBHAS CHANDRA BOSE": "Kolkata",
  "Indira Gandhi International": "Delhi",
  "Kempegowda International": "Bangalore",
  "Rajiv Gandhi International": "Hyderabad",
  "CHENNAI INTERNATIONAL": "Chennai"
};

// Define the constants that were missing
const AIRLINES = ["AirAsia", "Air_India", "GO_FIRST", "Indigo", "SpiceJet", "Vistara"];
const CITIES = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai'];
const CLASSES = ['Business', 'Economy'];
const STOPS = ['one', 'two_or_more', 'zero'];

const STOPS_MAPPING = {
  "0": "zero",
  "1": "one",
  "2+": "two_or_more"
};

// Helper function to build the payload
const buildPayload = (formData) => {
  // Validate departure date
  const departureDate = new Date(formData.departureDate);
  if (isNaN(departureDate)) {
    throw new Error("Invalid departure date");
  }

  // Calculate days_left correctly
  const daysLeft = Math.ceil(
    (departureDate - new Date()) / (1000 * 60 * 60 * 24)
  );

  const payload = {
    days_left: Math.max(daysLeft, 1),
    duration: parseFloat(formData.duration) || 0,
    departure_time: TIME_MAPPING[formData.departureTime],
    arrival_time: TIME_MAPPING[formData.arrivalTime],
  };

  // Airline encoding
  AIRLINES.forEach(airline => {
    payload[`airline_${airline}`] = formData.airline === airline ? 1 : 0;
  });

  // City encoding
  const sourceCity = CITY_MAPPING[formData.source_city] || formData.source_city;
  const destCity = CITY_MAPPING[formData.destination_city] || formData.destination_city;
  
  CITIES.forEach(city => {
    payload[`source_city_${city}`] = sourceCity === city ? 1 : 0;
    payload[`destination_city_${city}`] = destCity === city ? 1 : 0;
  });

  // Class encoding
  CLASSES.forEach(cls => {
    const key = `class_${cls.replace(' ', '_')}`;
    payload[key] = formData.travelClass === cls ? 1 : 0;
  });

  // Stops encoding
  const stopKey = STOPS_MAPPING[formData.stops];
  STOPS.forEach(stop => {
    payload[`stops_${stop}`] = stopKey === stop ? 1 : 0;
  });

  return payload;
};

export const predictFlightFare = async (formData) => {
  try {
    console.log("Received formData:", formData);
    
    // Validate all required fields are present
    if (!formData.departureTime || TIME_MAPPING[formData.departureTime] === undefined) {
      throw new Error("Missing required field: departure_time");
    }

    const payload = buildPayload(formData);
    console.log("Sending payload to API:", payload);
    
    const response = await axios.post(`${API_BASE}/predict`, payload);
    return response.data;
  } catch (error) {
    console.error("Error details:", error);
    throw new Error(error.response?.data?.error || 'Prediction failed');
  }
};

// NEW FUNCTION: For trend prediction
export const predictFlightTrend = async (formData) => {
  try {
    console.log("Received formData for trend prediction:", formData);
    
    // Validate all required fields are present
    if (!formData.departureTime || TIME_MAPPING[formData.departureTime] === undefined) {
      throw new Error("Missing required field: departure_time");
    }

    const payload = buildPayload(formData);
    console.log("Sending trend prediction payload to API:", payload);
    
    const response = await axios.post(`${API_BASE}/predict_trend`, payload);
    return response.data;
  } catch (error) {
    console.error("Error details in trend prediction:", error);
    throw new Error(error.response?.data?.error || 'Trend prediction failed');
  }
};
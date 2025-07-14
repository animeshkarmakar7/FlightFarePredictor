import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://flightfarepredictor-5osz.onrender.com';

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

const AIRLINES = ["AirAsia", "Air_India", "GO_FIRST", "Indigo", "SpiceJet", "Vistara"];
const CITIES = ['Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Kolkata', 'Mumbai'];
const CLASSES = ['Business', 'Economy'];
const STOPS = ['one', 'two_or_more', 'zero'];

const STOPS_MAPPING = {
  "0": "zero",
  "1": "one",
  "2+": "two_or_more"
};

// ✅ Updated function to correctly calculate days_left and send departure_date
const buildPayload = (formData) => {
  const departureDate = new Date(formData.departureDate);
  if (isNaN(departureDate)) {
    throw new Error("Invalid departure date");
  }

  // Corrected: Ensure days_left is at least 0 (not 1)
  const today = new Date();
  const daysLeft = Math.max(Math.ceil((departureDate - today) / (1000 * 60 * 60 * 24)), 0);

  const payload = {
    departure_date: departureDate.toISOString().split('T')[0], // ✅ Sending correct format
    days_left: daysLeft,
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
    payload[`class_${cls.replace(' ', '_')}`] = formData.travelClass === cls ? 1 : 0;
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

// ✅ Updated: Ensure trend prediction gets departure_date correctly
export const predictFlightTrend = async (formData) => {
  try {
    console.log("Received formData for trend prediction:", formData);
    
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
import axios from 'axios';


// 1. Move these to the top before they're used
const API_KEY = import.meta.env.VITE_AMADEUS_API_KEY;
const API_SECRET = import.meta.env.VITE_AMADEUS_API_SECRET;

let accessToken = null;

const getAccessToken = async () => {
  if (!accessToken) {
    // 2. Use the imported constants instead of process.env
    const response = await axios.post(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      `grant_type=client_credentials&client_id=${API_KEY}&client_secret=${API_SECRET}`,
      { headers: {'Content-Type': 'application/x-www-form-urlencoded'} }
    );
    accessToken = response.data.access_token;
  }
  return accessToken;
};

export const fetchAirportSuggestions = async (term) => {
  const token = await getAccessToken();
  
  const response = await axios.get(
    'https://test.api.amadeus.com/v1/reference-data/locations',
    {
      params: {
        subType: 'AIRPORT',
        keyword: term,
        'page[limit]': 5
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  
  return response.data.data.map(item => ({
    id: item.id,
    name: item.name,
    code: item.iataCode,
    type: item.subType
  }));
};
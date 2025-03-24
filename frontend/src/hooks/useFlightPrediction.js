import { useState } from 'react';
import { predictFlightFare, fetchPriceHistory } from '../services/api';

export const useFlightPrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getPrediction = async (params) => {
    try {
      setLoading(true);
      const [predictionData, historyData] = await Promise.all([
        predictFlightFare(params),
        fetchPriceHistory({
          origin: params.origin,
          destination: params.destination
        })
      ]);
      
      setPrediction(predictionData);
      setHistory(historyData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    prediction,
    history,
    loading,
    error,
    getPrediction
  };
};
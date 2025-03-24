import React, { createContext, useContext, useReducer } from 'react';

const PredictionContext = createContext();

const predictionReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PREDICTION':
      return { ...state, currentPrediction: action.payload };
    case 'SET_HISTORY':
      return { ...state, priceHistory: action.payload };
    default:
      return state;
  }
};

export const PredictionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(predictionReducer, {
    currentPrediction: null,
    priceHistory: []
  });

  return (
    <PredictionContext.Provider value={{ state, dispatch }}>
      {children}
    </PredictionContext.Provider>
  );
};

export const usePrediction = () => useContext(PredictionContext);
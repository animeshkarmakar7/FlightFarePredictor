

import React from 'react';
import Navbar from './components/Navbar/Navbar';
import Home from './components/flightPriceUi/FlightUi';
import { Toaster } from "react-hot-toast";
import Ticket from './components/flightPriceUi/ticket';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useWatch } from 'react-hook-form';


const App = () => {
  return (
    <Router>
      <Toaster />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fare" element={<Ticket   />} />
       
      </Routes>
    </Router>
  );
};

export default App;


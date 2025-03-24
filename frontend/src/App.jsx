// // src/App.jsx
// import React from 'react';
// import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
// import FlightFarePrediction from './components/flightPriceUi/FlightFarePrediction';
// import "tailwindcss";

// function App() {
//   return (
//     <BrowserRouter>

   
// <FlightFarePrediction/>
      
  
//     </BrowserRouter>
//   );
// }

// // Reusable NavLink component


// export default App;


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


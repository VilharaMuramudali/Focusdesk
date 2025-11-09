import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const CurrencyContext = createContext();

const DEFAULT_CURRENCY = "USD";
const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "INR", symbol: "₹" },
  { code: "EUR", symbol: "€" },
  // Add more as needed
];

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [rates, setRates] = useState({ USD: 1 }); // USD as base

  useEffect(() => {
    // Fetch latest rates (using USD as base)
    axios.get("https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/USD")
      .then(res => setRates(res.data.conversion_rates))
      .catch(() => setRates({ USD: 1, INR: 83, EUR: 0.92 })); // fallback
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, SUPPORTED_CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
};

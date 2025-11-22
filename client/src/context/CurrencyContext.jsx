import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const CurrencyContext = createContext();

const DEFAULT_CURRENCY = "LKR";
const SUPPORTED_CURRENCIES = [
  { code: "LKR", symbol: "Rs.", name: "Sri Lankan Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" }
];

export const CurrencyProvider = ({ children }) => {
  // Get saved currency from localStorage or use default
  const getSavedCurrency = () => {
    try {
      const saved = localStorage.getItem('selectedCurrency');
      return saved || DEFAULT_CURRENCY;
    } catch {
      return DEFAULT_CURRENCY;
    }
  };

  const [currency, setCurrency] = useState(getSavedCurrency);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch exchange rates from free API (no API key required)
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using exchangerate.host API (free, no API key needed)
        // This API uses USD as base currency
        const response = await axios.get('https://api.exchangerate.host/latest?base=USD', {
          timeout: 5000
        });
        
        // Normalise a few possible API response shapes
        const data = response && response.data ? response.data : response;
        let fetchedRates = null;

        if (data && typeof data === 'object') {
          if (data.rates && typeof data.rates === 'object') {
            fetchedRates = data.rates;
          } else if (data.conversion_rates && typeof data.conversion_rates === 'object') {
            // some free APIs return `conversion_rates` key
            fetchedRates = data.conversion_rates;
          } else if (data.quotes && typeof data.quotes === 'object') {
            // some APIs return `quotes` (e.g., USDXXX keys)
            // transform USDXXX -> XXX: value
            fetchedRates = Object.keys(data.quotes).reduce((acc, k) => {
              // quotes like USDLKR -> we strip USD
              const code = k.replace(/^USD/, '');
              acc[code] = data.quotes[k];
              return acc;
            }, {});
          }
        }

        if (!fetchedRates || Object.keys(fetchedRates).length === 0) {
          console.error('Unexpected exchange API response shape:', response);
          throw new Error('Invalid response format');
        }

        // Ensure USD is present as base 1
        const allRates = { USD: 1, ...fetchedRates };
        if (!allRates.USD) allRates.USD = fetchedRates['USD'] || 1;
        setRates(allRates);
        console.log('Exchange rates fetched successfully:', allRates);
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError(err.response?.data?.message || err.message || String(err));
        
        // Fallback rates (approximate as of common values)
        const fallbackRates = {
          USD: 1,
          LKR: 325,      // Approximate: 1 USD = 325 LKR
          EUR: 0.92,     // Approximate: 1 USD = 0.92 EUR
          GBP: 0.79,     // Approximate: 1 USD = 0.79 GBP
          INR: 83,       // Approximate: 1 USD = 83 INR
          AUD: 1.52,     // Approximate: 1 USD = 1.52 AUD
          CAD: 1.36,     // Approximate: 1 USD = 1.36 CAD
          JPY: 150,      // Approximate: 1 USD = 150 JPY
          CNY: 7.25,     // Approximate: 1 USD = 7.25 CNY
          AED: 3.67,     // Approximate: 1 USD = 3.67 AED
          SGD: 1.34,     // Approximate: 1 USD = 1.34 SGD
          MYR: 4.72      // Approximate: 1 USD = 4.72 MYR
        };
        setRates(fallbackRates);
        console.warn('Using fallback exchange rates');
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
    
    // Refresh rates every 30 minutes
    const interval = setInterval(fetchExchangeRates, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Save currency to localStorage when it changes
  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    try {
      localStorage.setItem('selectedCurrency', newCurrency);
    } catch (err) {
      console.error('Error saving currency preference:', err);
    }
  };

  // Convert amount from package currency to selected currency
  const convertCurrency = (amount, fromCurrency, toCurrency = currency) => {
    if (!amount || amount === 0) return 0;
    if (!rates || Object.keys(rates).length === 0) return amount;
    if (fromCurrency === toCurrency) return amount;
    
    // If we don't have rates, return original amount
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      console.warn(`Missing exchange rates for ${fromCurrency} or ${toCurrency}`);
      return amount;
    }
    
    try {
      // Convert to USD first (base currency), then to target currency
      const usdAmount = amount / rates[fromCurrency];
      const convertedAmount = usdAmount * rates[toCurrency];
      
      return convertedAmount;
    } catch (err) {
      console.error('Currency conversion error:', err);
      return amount;
    }
  };

  // Get currency symbol
  const getCurrencySymbol = (currencyCode = currency) => {
    const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    return currencyInfo?.symbol || currencyCode || '$';
  };

  const value = {
    currency,
    setCurrency: handleCurrencyChange,
    rates,
    loading,
    error,
    convertCurrency,
    getCurrencySymbol,
    SUPPORTED_CURRENCIES
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};


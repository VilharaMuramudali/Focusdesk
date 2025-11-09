// src/hooks/useConvertedPrice.js
import { useContext } from "react";
import { CurrencyContext } from "../context/CurrencyContext";

export function useConvertedPrice(amountInUSD) {
  const { currency, rates, SUPPORTED } = useContext(CurrencyContext);
  const symbol = SUPPORTED.find(c => c.code === currency)?.symbol || "$";
  const converted = rates && rates[currency] ? amountInUSD * rates[currency] : amountInUSD;
  return { price: `${symbol}${converted.toFixed(2)}`, symbol, currency };
}

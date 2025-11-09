// src/components/CurrencySelector.js
import React, { useContext } from "react";
import { CurrencyContext } from "../context/CurrencyContext";

function CurrencySelector() {
  const { currency, setCurrency, SUPPORTED, loading } = useContext(CurrencyContext);

  return (
    <select
      value={currency}
      onChange={e => setCurrency(e.target.value)}
      disabled={loading}
      style={{ marginLeft: 16, padding: 4, borderRadius: 4, border: "1px solid #ddd" }}
    >
      {SUPPORTED.map(cur => (
        <option key={cur.code} value={cur.code}>
          {cur.symbol} {cur.code}
        </option>
      ))}
    </select>
  );
}

export default CurrencySelector;

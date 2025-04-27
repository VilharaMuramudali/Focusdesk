// TabStateContext.jsx
import React, { createContext, useState, useContext } from "react";

const TabStateContext = createContext();

export function TabStateProvider({ children }) {
  const [tabStates, setTabStates] = useState({
    profile: null,
    packages: null,
    schedules: null,
    payments: null,
    settings: null,
    tools: null
  });

  const updateTabState = (tab, state) => {
    setTabStates(prev => ({
      ...prev,
      [tab]: state
    }));
  };

  return (
    <TabStateContext.Provider value={{ tabStates, updateTabState }}>
      {children}
    </TabStateContext.Provider>
  );
}

export function useTabState() {
  return useContext(TabStateContext);
}

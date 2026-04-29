import React, { createContext, useContext, useState } from 'react';

// Lightweight context for today's daily data shared across Dashboard & Journal.
// This will be replaced by a proper data layer (SQLite/Supabase) later.

interface DailyData {
  waterGlasses: number;
  setWaterGlasses: (glasses: number) => void;
}

const DailyDataContext = createContext<DailyData | undefined>(undefined);

export function DailyDataProvider({ children }: { children: React.ReactNode }) {
  const [waterGlasses, setWaterGlasses] = useState(5); // mock initial

  return (
    <DailyDataContext.Provider value={{ waterGlasses, setWaterGlasses }}>
      {children}
    </DailyDataContext.Provider>
  );
}

export function useDailyData() {
  const context = useContext(DailyDataContext);
  if (!context) {
    throw new Error('useDailyData must be used within a DailyDataProvider');
  }
  return context;
}

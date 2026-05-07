import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Define the shape of your context
// Using 'any' for flexibility, but you can replace 'any' with a specific 
// interface (like CartDetails | null) if you want strict TypeScript typing.
interface RoutePayloadContextType {
  routePayload: any; 
  setRoutePayload: (data: any) => void;
  clearRoutePayload: () => void;
}

// 2. Create the Context
const RoutePayloadContext = createContext<RoutePayloadContextType | undefined>(undefined);

// 3. Create the Provider Component
export const RoutePayloadProvider = ({ children }: { children: ReactNode }) => {
  const [routePayload, setRoutePayload] = useState<any>(null);

  const clearRoutePayload = () => setRoutePayload(null);

  return (
    <RoutePayloadContext.Provider value={{ routePayload, setRoutePayload, clearRoutePayload }}>
      {children}
    </RoutePayloadContext.Provider>
  );
};

// 4. Create a custom hook for easy access
export const useRoutePayload = () => {
  const context = useContext(RoutePayloadContext);
  if (context === undefined) {
    throw new Error('useRoutePayload must be used within a RoutePayloadProvider');
  }
  return context;
};
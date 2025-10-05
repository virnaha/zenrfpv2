import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationContextType {
  currentPath: string;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  navigateWithGuard: (path: string) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  pendingNavigation: string | null;
  navigationHistory: string[];
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  // Track navigation history
  useEffect(() => {
    setNavigationHistory(prev => [...prev, location.pathname].slice(-10)); // Keep last 10 locations
  }, [location.pathname]);

  const navigateWithGuard = useCallback((path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
    } else {
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate]);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      setHasUnsavedChanges(false);
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, navigate]);

  const cancelNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  const goBack = useCallback(() => {
    if (navigationHistory.length > 1) {
      const previousPath = navigationHistory[navigationHistory.length - 2];
      navigateWithGuard(previousPath);
    } else {
      navigateWithGuard('/');
    }
  }, [navigationHistory, navigateWithGuard]);

  // Handle browser back button with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const value: NavigationContextType = {
    currentPath: location.pathname,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    navigateWithGuard,
    confirmNavigation,
    cancelNavigation,
    pendingNavigation,
    navigationHistory,
    goBack,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

import { useState, useEffect } from 'react';

const MAX_HISTORY_ITEMS = 5; 

export function useSessionHistory() {
  const [history, setHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const data = sessionStorage.getItem('data');
      if (data) {
        setHistory(JSON.parse(data));
      }
    } catch (error) {
      console.error('Ошибка чтения истории:', error);
      setHistory([]); 
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      sessionStorage.setItem('data', JSON.stringify(history));
    } catch (error) {
      console.error('Ошибка записи в sessionStorage (возможно превышен лимит):', error);
      if (history.length > 1) {
        const newHistory = history.slice(1); 
        setHistory(newHistory);
      }
    }
  }, [history, isLoaded]);

  const addResult = (newItem) => {
    setHistory((prev) => {
      const exists = prev.find(item => item.id === newItem.id);
      if (exists) return prev;

      const newHistory = [newItem, ...prev];
      
      if (newHistory.length > MAX_HISTORY_ITEMS) {
        return newHistory.slice(0, MAX_HISTORY_ITEMS);
      }
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem('data');
  };

  return { history, addResult, clearHistory, isLoaded };
}
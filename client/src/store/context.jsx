import { createContext, useContext, useReducer, useEffect } from 'react';
import { reducer, initialState } from './reducer.js';
import { SET_CATEGORIES, SET_TRANSACTIONS, SET_LOADING, SET_ERROR } from './actions.js';
import { listCategories } from '../api/categories.js';
import { listTransactions } from '../api/transactions.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    dispatch({ type: SET_LOADING, payload: true });
    listCategories()
      .then((cats) => dispatch({ type: SET_CATEGORIES, payload: cats }))
      .catch((err) => dispatch({ type: SET_ERROR, payload: err.message }))
      .finally(() => dispatch({ type: SET_LOADING, payload: false }));
  }, []);

  useEffect(() => {
    dispatch({ type: SET_LOADING, payload: true });
    listTransactions(state.activeMonth)
      .then((txns) => dispatch({ type: SET_TRANSACTIONS, payload: txns }))
      .catch((err) => dispatch({ type: SET_ERROR, payload: err.message }))
      .finally(() => dispatch({ type: SET_LOADING, payload: false }));
  }, [state.activeMonth]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

import {
  SET_CATEGORIES, ADD_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY,
  SET_TRANSACTIONS, ADD_TRANSACTION, UPDATE_TRANSACTION, DELETE_TRANSACTION,
  SET_ACTIVE_MONTH, SET_LOADING, SET_ERROR,
} from './actions.js';
import { currentMonth } from '../lib/date.js';

export const initialState = {
  categories: [],
  transactions: [],
  activeMonth: currentMonth(),
  loading: false,
  error: null,
};

export function reducer(state, { type, payload }) {
  switch (type) {
    case SET_CATEGORIES:
      return { ...state, categories: payload };
    case ADD_CATEGORY:
      return { ...state, categories: [...state.categories, payload] };
    case UPDATE_CATEGORY:
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === payload.id ? payload : c)),
      };
    case DELETE_CATEGORY:
      return { ...state, categories: state.categories.filter((c) => c.id !== payload) };

    case SET_TRANSACTIONS:
      return { ...state, transactions: payload };
    case ADD_TRANSACTION:
      return { ...state, transactions: [...state.transactions, payload] };
    case UPDATE_TRANSACTION:
      return {
        ...state,
        transactions: state.transactions.map((t) => (t.id === payload.id ? payload : t)),
      };
    case DELETE_TRANSACTION:
      return { ...state, transactions: state.transactions.filter((t) => t.id !== payload) };

    case SET_ACTIVE_MONTH:
      return { ...state, activeMonth: payload, transactions: [] };

    case SET_LOADING:
      return { ...state, loading: payload };
    case SET_ERROR:
      return { ...state, error: payload };

    default:
      return state;
  }
}

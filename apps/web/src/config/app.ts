export const APP_NAME = 'Bilimdon';
export const APP_TAGLINE = "Universitet o'quv platformasi";

export const API_MODE = (import.meta.env.VITE_API_MODE ?? 'mock') as 'mock' | 'http';
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
export const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export const IS_MOCK = API_MODE === 'mock';

import type L from 'leaflet';

let _map: L.Map | null = null;

export const setMapRef = (map: L.Map | null) => { _map = map; };
export const getMapRef = () => _map;

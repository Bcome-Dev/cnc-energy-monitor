// KONFIGURASI CONTOH (bukan tarif/standar resmi). Dapat diubah di halaman Pengaturan.
export const DEFAULT_SETTINGS={tariff:1500,energyLimit:5,powerLimit:700,vMin:200,vMax:240,iMax:3.5,interval:3};
export const LOADS={lamp:40,fan:4,controller:35,machine:[520,680],pf:0.9}; // watt, asumsi simulasi
export const RANGES=[{k:'15m',l:'15 menit',ms:9e5},{k:'1h',l:'1 jam',ms:3.6e6},{k:'6h',l:'6 jam',ms:2.16e7},{k:'24h',l:'24 jam',ms:8.64e7},{k:'3d',l:'3 hari',ms:2.592e8}];

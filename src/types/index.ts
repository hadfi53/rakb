// Réexporter les types depuis les fichiers individuels
// Cela permet d'avoir un point d'entrée unique pour les imports

// Réexporter depuis vehicle.ts
export * from './vehicle';

// Réexporter depuis booking.ts
export * from './booking';

// Réexporter depuis user.ts
export * from './user';

// Assurer la compatibilité avec lib/types.ts
// Si nécessaire, vous pouvez ajouter des réexportations ou des adaptateurs ici 
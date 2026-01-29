import path from 'path';

/**
 * Utility to resolve paths consistently across development and production (dist).
 */

const isDist = __dirname.includes('dist');

// If in server/utils/paths.ts -> ROOT is ..
// If in server/dist/utils/paths.ts -> ROOT is ../../..
export const SERVER_ROOT = isDist
    ? path.join(__dirname, '../../..')
    : path.join(__dirname, '..');


/**
 * Resolves a path relative to the server root.
 * @param relativePath Path relative to the server root.
 */
export const resolveFromRoot = (relativePath: string) => {
    return path.join(SERVER_ROOT, relativePath);
};

export const DATA_PATHS = {
    shops: resolveFromRoot('shops.json'),
    technicians: resolveFromRoot('technicians.json'),
    repairableDevices: resolveFromRoot('repairabledevices.json'),
    repairableModels: resolveFromRoot('repairableModels.json'),
    locations: resolveFromRoot('locations.json'),
    deliveryPersonnel: resolveFromRoot('deliverypersonnel.json'),
};

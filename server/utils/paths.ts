import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDist = __dirname.includes('dist');

// If in server/utils/paths.ts -> ROOT is ..
// If in server/dist/utils/paths.ts -> ROOT is ../../..
export const SERVER_ROOT = isDist
    ? path.join(__dirname, '../../../') // server/dist/utils/paths.js -> ../../../ -> monorepo root
    : path.join(__dirname, '../../');    // server/utils/paths.ts -> ../../ -> monorepo root


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

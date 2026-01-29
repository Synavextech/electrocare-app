"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_PATHS = exports.resolveFromRoot = exports.SERVER_ROOT = void 0;
const path_1 = __importDefault(require("path"));
/**
 * Utility to resolve paths consistently across development and production (dist).
 */
const isDist = __dirname.includes('dist');
// If in server/utils/paths.ts -> ROOT is ..
// If in server/dist/utils/paths.ts -> ROOT is ../../..
exports.SERVER_ROOT = isDist
    ? path_1.default.join(__dirname, '../../..')
    : path_1.default.join(__dirname, '..');
/**
 * Resolves a path relative to the server root.
 * @param relativePath Path relative to the server root.
 */
const resolveFromRoot = (relativePath) => {
    return path_1.default.join(exports.SERVER_ROOT, relativePath);
};
exports.resolveFromRoot = resolveFromRoot;
exports.DATA_PATHS = {
    shops: (0, exports.resolveFromRoot)('shops.json'),
    technicians: (0, exports.resolveFromRoot)('technicians.json'),
    repairableDevices: (0, exports.resolveFromRoot)('repairabledevices.json'),
    repairableModels: (0, exports.resolveFromRoot)('repairableModels.json'),
    locations: (0, exports.resolveFromRoot)('locations.json'),
    deliveryPersonnel: (0, exports.resolveFromRoot)('deliverypersonnel.json'),
};
//# sourceMappingURL=paths.js.map
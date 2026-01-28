"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// In CommonJS __dirname and __filename are available globally.
// If using TS with CommonJS, we don't need fileURLToPath(import.meta.url)
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const isDist = __dirname.endsWith('dist');
const reqPath = isDist ? '../..' : '..';
dotenv_1.default.config({ path: path_1.default.join(__dirname, reqPath, '.env') });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
//# sourceMappingURL=db.js.map
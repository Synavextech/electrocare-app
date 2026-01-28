"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const sale_1 = require("../controllers/sale");
const router = express_1.default.Router();
router.use(auth_1.default);
router.post('/', sale_1.createDeviceSale);
router.get('/', sale_1.getMySales);
exports.default = router;
//# sourceMappingURL=sale.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shop_1 = require("../controllers/shop");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.get('/', shop_1.listShops);
router.get('/nearby', shop_1.getNearby);
router.post('/', auth_1.default, shop_1.registerShop); // Protected route
exports.default = router;
//# sourceMappingURL=shop.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const marketplace_1 = require("../controllers/marketplace");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.get('/', marketplace_1.listListings);
router.post('/', auth_1.default, marketplace_1.postListing);
router.post('/purchase', auth_1.default, marketplace_1.purchaseListing);
exports.default = router;
//# sourceMappingURL=marketplace.js.map
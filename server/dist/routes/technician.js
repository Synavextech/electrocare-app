"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const technician_1 = require("../controllers/technician");
const router = express_1.default.Router();
router.use(auth_1.default);
router.get('/', technician_1.listTechnicians);
router.get('/assignments', technician_1.getMyAssignments);
router.post('/accept/:id', technician_1.acceptRepair);
exports.default = router;
//# sourceMappingURL=technician.js.map
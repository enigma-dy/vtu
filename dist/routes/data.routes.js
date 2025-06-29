"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vtu_controller_1 = require("../controllers/vtu.controller");
const router = (0, express_1.Router)();
router.post('/data', vtu_controller_1.setDataPrices);
router.get('/fetch', vtu_controller_1.fetchVtuDataPricing);
router.get('/data', vtu_controller_1.getVtuDataPrices);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
router.post('/flw/create', payment_controller_1.initiatePayment);
router.get('/callback', async (req, res) => {
    const { status, transaction_id } = req.query;
    return res.redirect(`http://localhost:5173/payment/result?status=${status}&transaction_id=${transaction_id}`);
});
exports.default = router;

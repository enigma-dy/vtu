"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webhook = exports.verifyPayment = exports.initiatePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_BASE_URL = process.env.BASE_URL || 'https://api.flutterwave.com/v3';
const prisma = new client_1.PrismaClient();
const initiatePayment = async (req, res) => {
    const { email, amount, currency = 'NGN', phone_number, purpose, metadata, userId, serviceId, } = req.body;
    const tx_ref = `VTU_${Date.now()}_${(0, uuid_1.v4)()}`;
    try {
        const transaction = await prisma.transaction.create({
            data: {
                reference: tx_ref,
                description: purpose || 'VTU Payment',
                status: client_1.TransactionStatus.PENDING,
                metadata,
            },
        });
        await prisma.vTUTransaction.create({
            data: {
                reference: tx_ref,
                amount,
                email,
                phoneNumber: phone_number,
                userId,
                serviceId,
                transactionId: transaction.id,
                status: client_1.VTUStatus.PENDING,
            },
        });
        const response = await axios_1.default.post(`${FLW_BASE_URL}/payments`, {
            tx_ref,
            amount,
            currency,
            redirect_url: 'http://localhost:3000/payment/callback',
            customer: {
                email,
                phonenumber: phone_number,
                name: email,
            },
            customizations: {
                title: 'VTU Purchase',
                description: 'Payment for VTU services',
                logo: 'https://your-logo-url.com/logo.png',
            },
        }, {
            headers: {
                Authorization: `Bearer ${FLW_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        const paymentLink = response.data.data.link;
        res.status(200).json({
            success: true,
            message: 'Payment initiated',
            payment_link: paymentLink,
            tx_ref,
        });
    }
    catch (error) {
        console.error('Error initiating payment:', error.message);
        res.status(500).json({
            success: false,
            message: 'Payment initiation failed',
            error: error.message,
        });
    }
};
exports.initiatePayment = initiatePayment;
const verifyPayment = async (req, res) => {
    const { transaction_id } = req.query;
    if (!transaction_id) {
        res
            .status(400)
            .json({ success: false, message: 'Transaction ID is required' });
        return;
    }
    try {
        const response = await axios_1.default.get(`${FLW_BASE_URL}/transactions/${transaction_id}/verify`, {
            headers: {
                Authorization: `Bearer ${FLW_SECRET_KEY}`,
            },
        });
        const data = response.data.data;
        const txRef = data.tx_ref;
        const status = data.status.toUpperCase();
        const vtuTx = await prisma.vTUTransaction.update({
            where: { reference: txRef },
            data: {
                status,
                providerResponse: data,
                updatedAt: new Date(),
            },
            // include: {
            //   user: true,
            //   transaction: true,
            // },
        });
        await prisma.transaction.update({
            where: { reference: txRef },
            data: {
                status: status === 'SUCCESSFUL'
                    ? client_1.TransactionStatus.COMPLETED
                    : client_1.TransactionStatus.FAILED,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Payment verified',
            orderStatus: status,
        });
    }
    catch (err) {
        console.error('Verification error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Verification failed',
            error: err.message,
        });
    }
};
exports.verifyPayment = verifyPayment;
const Webhook = async (req, res) => {
    const secretHash = process.env.FLUTTERWAVE_HASH;
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== secretHash) {
        res.status(401).send('Unauthorized');
        return;
    }
    const payload = req.body;
    if (payload.event === 'charge.completed') {
        const txRef = payload.data.tx_ref;
        const flwStatus = payload.data.status.toUpperCase();
        try {
            await prisma.vTUTransaction.update({
                where: { reference: txRef },
                data: {
                    status: flwStatus,
                    providerResponse: payload.data,
                },
            });
            await prisma.transaction.update({
                where: { reference: txRef },
                data: {
                    status: flwStatus === 'SUCCESSFUL' ? 'COMPLETED' : 'FAILED',
                },
            });
            res.sendStatus(200);
        }
        catch (err) {
            console.error('Webhook handling error:', err);
            res.sendStatus(500);
        }
    }
    else {
        res.sendStatus(200);
    }
};
exports.Webhook = Webhook;

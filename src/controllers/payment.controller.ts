import { Request, Response, RequestHandler } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { PrismaClient, TransactionStatus, VTUStatus } from '@prisma/client';

dotenv.config();

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY!;
const FLW_BASE_URL = process.env.BASE_URL || 'https://api.flutterwave.com/v3';
const prisma = new PrismaClient();

export const initiatePayment: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const {
    email,
    amount,
    currency = 'NGN',
    phone_number,
    purpose,
    metadata,
    userId,
    serviceId,
  } = req.body;

  const tx_ref = `VTU_${Date.now()}_${uuidv4()}`;

  try {
    const transaction = await prisma.transaction.create({
      data: {
        reference: tx_ref,
        description: purpose || 'VTU Payment',
        status: TransactionStatus.PENDING,
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
        status: VTUStatus.PENDING,
      },
    });

    const response = await axios.post(
      `${FLW_BASE_URL}/payments`,
      {
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
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const paymentLink = response.data.data.link;

    res.status(200).json({
      success: true,
      message: 'Payment initiated',
      payment_link: paymentLink,
      tx_ref,
    });
  } catch (error: any) {
    console.error('Error initiating payment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
      error: error.message,
    });
  }
};

export const verifyPayment: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { transaction_id } = req.query;

  if (!transaction_id) {
    res
      .status(400)
      .json({ success: false, message: 'Transaction ID is required' });
    return;
  }

  try {
    const response = await axios.get(
      `${FLW_BASE_URL}/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
        },
      },
    );

    const data = response.data.data;
    const txRef = data.tx_ref;
    const status = data.status.toUpperCase() as VTUStatus;

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
        status:
          status === 'SUCCESSFUL'
            ? TransactionStatus.COMPLETED
            : TransactionStatus.FAILED,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified',
      orderStatus: status,
    });
  } catch (err: any) {
    console.error('Verification error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: err.message,
    });
  }
};

export const Webhook: RequestHandler = async (req, res) => {
  const secretHash = process.env.FLUTTERWAVE_HASH!;
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
    } catch (err) {
      console.error('Webhook handling error:', err);
      res.sendStatus(500);
    }
  } else {
    res.sendStatus(200);
  }
};

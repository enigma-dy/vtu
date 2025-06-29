import { Router } from 'express';
import { initiatePayment } from '../controllers/payment.controller';
const router = Router();

router.post('/flw/create', initiatePayment);

router.get('/callback', async (req, res) => {
  const { status, transaction_id } = req.query;

  return res.redirect(
    `http://localhost:5173/payment/result?status=${status}&transaction_id=${transaction_id}`,
  );
});

export default router;

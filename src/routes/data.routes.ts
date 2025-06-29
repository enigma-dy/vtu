import express, { Router } from 'express';
import {
  fetchVtuDataPricing,
  getVtuDataPrices,
  setDataPrices,
} from '../controllers/vtu.controller';

const router = Router();

router.post('/data', setDataPrices);
router.get('/fetch', fetchVtuDataPricing);
router.get('/data', getVtuDataPrices);

export default router;

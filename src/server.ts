import express from 'express';
import cors from 'cors';
import { PrismaClient } from './generated/prisma';
import ebills from './routes/data.routes';
import paymentRouter from './routes/payment.route';

const prisma = new PrismaClient();
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use('/pricing', ebills);
app.use('/payment', paymentRouter);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

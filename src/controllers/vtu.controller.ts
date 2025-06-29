import { Request, Response, RequestHandler } from 'express';
import axios from 'axios';
import { PrismaClient, VTUCategory } from '../generated/prisma';

const prisma = new PrismaClient();

export const fetchVtuDataPricing: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const response = await axios.get(`${process.env.VTU_PROVIDER}`);

    const rawPlans = response.data?.data as any[];

    if (!Array.isArray(rawPlans)) {
      throw new Error('Unexpected response format: expected an array');
    }

    const servicesToInsert = rawPlans.map((plan: any) => ({
      name: plan.data_plan,
      code: `${plan.service_id}_${plan.data_plan.replace(/\s+/g, '_')}`,
      category: 'DATA' as VTUCategory,
      provider: plan.service_name,
      rates: plan,
    }));

    for (const service of servicesToInsert) {
      await prisma.vTUService.upsert({
        where: { code: service.code },
        update: {
          name: service.name,
          provider: service.provider,
          rates: service.rates,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          name: service.name,
          code: service.code,
          category: service.category,
          provider: service.provider,
          rates: service.rates,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'VTU products fetched and stored successfully',
      count: servicesToInsert.length,
    });
  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred';

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
      console.error('Axios error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      errorMessage = error.message;
      console.error('Unknown error:', errorMessage);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch and store VTU product list',
      error: errorMessage,
    });
  }
};

export const getVtuDataPrices: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const data = await prisma.vTUService.findMany({
      where: {
        category: 'DATA',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        provider: true,
        rates: true,
        sellingPrice: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        provider: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      message: 'VTU data prices retrieved successfully',
      count: data.length,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching VTU data prices:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve VTU data prices',
      error: error.message,
    });
  }
};

export const setDataPrices: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { variation_id, price } = req.body;

  try {
    const data = await prisma.vTUService.findFirst({
      where: { id: variation_id },
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Data plan not found',
      });
      return;
    }

    const updated = await prisma.vTUService.update({
      where: { id: variation_id },
      data: { sellingPrice: price },
    });

    res.status(200).json({
      success: true,
      message: 'Selling price updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating selling price:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update selling price',
      error: error.message,
    });
  }
};

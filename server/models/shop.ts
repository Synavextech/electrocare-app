import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

const shopsPath = path.join(__dirname, '..', 'shops.json');

export interface Shop {
  id: string;
  shopCode: string; // Serialized ID: DDMMYY-COUNTY-NNN
  name: string;
  address: string;
  lat: number;
  lng: number;
  county: string;
  services?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const ShopSchema = z.object({
  name: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  county: z.string(),
});

export const createShop = async (data: Partial<Shop>) => {
  let shops: Shop[] = [];
  try {
    const shopsData = await fs.readFile(shopsPath, 'utf8');
    shops = JSON.parse(shopsData);
  } catch (error) {
    // File might not exist or be empty
    shops = [];
  }

  // Generate Shop Code: DDMMYY-COUNTY-NNN
  const date = new Date();
  const yyyy = date.getFullYear().toString().slice(-2); // YY
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${dd}${mm}${yyyy}`;
  const county = data.county!.toUpperCase().replace(/\s+/g, '');

  // Find count of shops in this county
  const countyShops = shops.filter(s => s.county.toUpperCase().replace(/\s+/g, '') === county);
  const sequence = String(countyShops.length + 1).padStart(3, '0');
  const shopCode = `${dateStr}-${county}-${sequence}`;

  const newShop: Shop = {
    id: crypto.randomUUID(),
    shopCode,
    name: data.name!,
    address: data.address!,
    lat: data.lat!,
    lng: data.lng!,
    county: data.county!,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  shops.push(newShop);
  await fs.writeFile(shopsPath, JSON.stringify(shops, null, 2));
  return newShop;
};

export const getShops = async () => {
  try {
    const shopsData = await fs.readFile(shopsPath, 'utf8');
    return JSON.parse(shopsData) as Shop[];
  } catch (error) {
    return [];
  }
};

export const getNearbyShops = async (location: string) => {
  try {
    const shopsData = await fs.readFile(shopsPath, 'utf8');
    return JSON.parse(shopsData) as Shop[];
  } catch (error) {
    return [];
  }
};
import { z } from 'zod';
export interface Shop {
    id: string;
    shopCode: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    county: string;
    services?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const ShopSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodString;
    lat: z.ZodNumber;
    lng: z.ZodNumber;
    county: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    address: string;
    lat: number;
    lng: number;
    county: string;
}, {
    name: string;
    address: string;
    lat: number;
    lng: number;
    county: string;
}>;
export declare const createShop: (data: Partial<Shop>) => Promise<Shop>;
export declare const getShops: () => Promise<Shop[]>;
export declare const getNearbyShops: (location: string) => Promise<Shop[]>;
//# sourceMappingURL=shop.d.ts.map
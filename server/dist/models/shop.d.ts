import { z } from 'zod';
export interface Shop {
    id: string;
    shopCode: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    county: string;
    rating?: number;
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
    services: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    address: string;
    lat: number;
    lng: number;
    county: string;
    services?: string[] | undefined;
}, {
    name: string;
    address: string;
    lat: number;
    lng: number;
    county: string;
    services?: string[] | undefined;
}>;
export declare const createShop: (data: Partial<Shop>) => Promise<any>;
export declare const getShops: () => Promise<Shop[]>;
export declare const getNearbyShops: (location: string) => Promise<Shop[]>;
export declare const getShopByCode: (shopCode: string) => Promise<Shop | null>;
export declare const updateShopServices: (shopCode: string, services: string[]) => Promise<any>;
//# sourceMappingURL=shop.d.ts.map
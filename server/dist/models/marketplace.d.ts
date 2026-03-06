import { z } from 'zod';
export interface DeviceSale {
    id: string;
    userId: string;
    shopId?: string;
    device: string;
    description: string;
    price: number;
    pointsAwarded?: number;
    cashAwarded?: number;
    imageUrls: string[];
    condition: 'New' | 'Used' | 'Refurbished' | 'Unusable';
    status: 'pending' | 'approved' | 'rejected' | 'sold';
    mainCategory: 'Mobile Phone' | 'Laptop';
    subCategory: 'Device' | 'Accessory';
    serialNumber: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface DevicePurchase {
    id: string;
    saleId: string;
    buyerId: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    price: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ListingSchema: z.ZodObject<{
    device: z.ZodString;
    description: z.ZodString;
    price: z.ZodNumber;
    imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    condition: z.ZodEnum<["New", "Used", "Refurbished", "Unusable"]>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mainCategory: z.ZodEnum<["Mobile Phone", "Laptop"]>;
    subCategory: z.ZodEnum<["Device", "Accessory"]>;
}, "strip", z.ZodTypeAny, {
    description: string;
    device: string;
    price: number;
    condition: "New" | "Used" | "Refurbished" | "Unusable";
    mainCategory: "Mobile Phone" | "Laptop";
    subCategory: "Device" | "Accessory";
    imageUrls?: string[] | undefined;
    location?: string | null | undefined;
}, {
    description: string;
    device: string;
    price: number;
    condition: "New" | "Used" | "Refurbished" | "Unusable";
    mainCategory: "Mobile Phone" | "Laptop";
    subCategory: "Device" | "Accessory";
    imageUrls?: string[] | undefined;
    location?: string | null | undefined;
}>;
export declare const createListing: (data: any, userRole: string) => Promise<any>;
export declare const getListings: (mainCategory?: string, subCategory?: string) => Promise<any[]>;
//# sourceMappingURL=marketplace.d.ts.map
import { z } from 'zod';
export interface DeviceSale {
    id: string;
    userId: string;
    shopId?: string;
    device: string;
    description: string;
    price: number;
    imageUrls: string[];
    condition: 'New' | 'Used' | 'Refurbished' | 'Unusable';
    status: 'pending' | 'approved' | 'rejected' | 'sold';
    category?: string;
    subCategory?: string;
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
    title: z.ZodString;
    description: z.ZodString;
    price: z.ZodNumber;
    imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    condition: z.ZodEnum<["New", "Used", "Refurbished", "Unusable"]>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    subCategory: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    price: number;
    condition: "New" | "Used" | "Refurbished" | "Unusable";
    imageUrls?: string[] | undefined;
    location?: string | null | undefined;
    category?: string | undefined;
    subCategory?: string | undefined;
}, {
    description: string;
    title: string;
    price: number;
    condition: "New" | "Used" | "Refurbished" | "Unusable";
    imageUrls?: string[] | undefined;
    location?: string | null | undefined;
    category?: string | undefined;
    subCategory?: string | undefined;
}>;
export declare const createListing: (data: any, userRole: string) => Promise<any>;
export declare const getListings: () => Promise<any[]>;
//# sourceMappingURL=marketplace.d.ts.map
import { z } from 'zod';
export declare const SaleSchema: z.ZodObject<{
    device: z.ZodString;
    price: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    condition: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    serialNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    price: number;
    device: string;
    description?: string | undefined;
    condition?: string | undefined;
    imageUrl?: string | undefined;
    serialNumber?: string | undefined;
}, {
    price: number;
    device: string;
    description?: string | undefined;
    condition?: string | undefined;
    imageUrl?: string | undefined;
    serialNumber?: string | undefined;
}>;
export declare const createSale: (data: any) => Promise<any>;
export declare const getSalesByUser: (userId: string) => Promise<any[]>;
export declare const updateSale: (id: string, data: any) => Promise<any>;
//# sourceMappingURL=sale.d.ts.map
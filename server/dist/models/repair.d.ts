import { z } from 'zod';
export interface RepairRequest {
    id: string;
    request_id: string;
    userId: string;
    technicianId?: string;
    shopId?: string;
    deliveryPersonnelId?: string;
    device_type: string;
    device_model: string;
    issue: string;
    status: string;
    delivery: boolean;
    trackingNumber?: string;
    cost?: number;
    paymentMethod?: 'online' | 'cod';
    discount?: number;
    estimatedTime?: number;
    acceptedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const RepairSchema: z.ZodObject<{
    device_type: z.ZodString;
    device_model: z.ZodOptional<z.ZodString>;
    issue: z.ZodString;
    delivery: z.ZodOptional<z.ZodBoolean>;
    shopId: z.ZodOptional<z.ZodString>;
    technicianId: z.ZodOptional<z.ZodString>;
    deliveryPersonnelId: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["online", "cod"]>>;
}, "strip", z.ZodTypeAny, {
    device_type: string;
    issue: string;
    delivery?: boolean | undefined;
    device_model?: string | undefined;
    shopId?: string | undefined;
    technicianId?: string | undefined;
    deliveryPersonnelId?: string | undefined;
    paymentMethod?: "online" | "cod" | undefined;
}, {
    device_type: string;
    issue: string;
    delivery?: boolean | undefined;
    device_model?: string | undefined;
    shopId?: string | undefined;
    technicianId?: string | undefined;
    deliveryPersonnelId?: string | undefined;
    paymentMethod?: "online" | "cod" | undefined;
}>;
export declare const createRepair: (data: any) => Promise<any>;
export declare const getRepairsByUser: (userId: string) => Promise<any[]>;
export declare const getRepairById: (id: string) => Promise<any>;
export declare const updateRepair: (id: string, data: Partial<RepairRequest>) => Promise<any>;
//# sourceMappingURL=repair.d.ts.map
import { z } from 'zod';
export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'user' | 'technician' | 'delivery' | 'admin' | 'shop';
    wallet?: {
        balance: number;
        points: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    password: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["user", "technician", "delivery", "admin", "shop"]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: "user" | "technician" | "delivery" | "admin" | "shop" | undefined;
}, {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: "user" | "technician" | "delivery" | "admin" | "shop" | undefined;
}>;
export declare const createUser: (data: any) => Promise<any>;
export declare const getUserByEmail: (email: string) => Promise<any>;
export declare const getUserById: (id: string) => Promise<any>;
export declare const updateUser: (id: string, data: Partial<User>) => Promise<any>;
//# sourceMappingURL=user.d.ts.map
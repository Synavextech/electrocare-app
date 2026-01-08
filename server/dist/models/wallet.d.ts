import { z } from 'zod';
export declare const TransactionSchema: z.ZodObject<{
    amount: z.ZodNumber;
    type: z.ZodEnum<["deposit", "withdrawal", "payment", "redeem"]>;
}, "strip", z.ZodTypeAny, {
    type: "deposit" | "withdrawal" | "payment" | "redeem";
    amount: number;
}, {
    type: "deposit" | "withdrawal" | "payment" | "redeem";
    amount: number;
}>;
export declare const createTransaction: (data: {
    walletId: string;
    type: string;
    amount: number;
}) => Promise<any>;
export declare const getTransactionsByUser: (userId: string) => Promise<any[]>;
export declare const updateWallet: (userId: string, data: {
    balance?: number;
    points?: number;
}) => Promise<any>;
//# sourceMappingURL=wallet.d.ts.map
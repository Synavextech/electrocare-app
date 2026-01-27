interface Technician {
    id: string;
    name: string;
    phone: string;
    isTrained: boolean;
    referral: string;
    shopId: string;
}
export declare const getTechniciansByShop: (shopId?: string) => Promise<Technician[]>;
export declare const getTechnicianById: (id: string) => Promise<Technician | null>;
export declare const createTechnician: (data: {
    userId: string;
}) => Promise<Technician>;
export {};
//# sourceMappingURL=technician.d.ts.map
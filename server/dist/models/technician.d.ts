export interface Technician {
    id: string;
    name: string;
    description: string;
    phone: string;
    email: string;
    rating: number;
    reviews: number;
    category: string;
    subCategory: string;
    shopId: string;
    createdAt: string;
}
export declare const getTechniciansByShop: (shopId?: string) => Promise<Technician[]>;
export declare const getTechnicianById: (id: string) => Promise<Technician | null>;
export declare const createTechnician: (data: Partial<Technician>) => Promise<Technician>;
//# sourceMappingURL=technician.d.ts.map
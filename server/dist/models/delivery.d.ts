export interface DeliveryPersonnel {
    id: string;
    name: string;
    type: 'RealTime' | 'OneTime';
    region: string;
    rating: number;
    current_load: number;
    shopId: string;
    email: string;
    createdAt: string;
}
export declare const getDeliveryPersonnelByShop: (shopId?: string) => Promise<DeliveryPersonnel[]>;
export declare const createDeliveryPersonnel: (data: Partial<DeliveryPersonnel>) => Promise<DeliveryPersonnel>;
//# sourceMappingURL=delivery.d.ts.map
export interface RoleApplication {
    id?: string;
    userId: string;
    requestedRole: 'technician' | 'delivery';
    status: 'pending' | 'approved' | 'rejected';
    documents: string[];
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const createApplication: (data: RoleApplication) => Promise<any>;
export declare const getPendingApplications: () => Promise<any[]>;
export declare const updateApplicationStatus: (id: string, status: "approved" | "rejected") => Promise<any>;
//# sourceMappingURL=roleApplication.d.ts.map
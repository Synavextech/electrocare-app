export interface DeviceType {
    id: string;
    name: string;
    icon: string;
    createdAt: string;
}
export interface DeviceModel {
    id: string;
    name: string;
    brand: string;
    deviceTypeId: string;
    createdAt: string;
}
export declare const getDeviceTypes: () => Promise<DeviceType[]>;
export declare const getDeviceModels: (deviceTypeId?: string) => Promise<DeviceModel[]>;
export declare const createDeviceType: (name: string, icon: string) => Promise<DeviceType>;
export declare const createDeviceModel: (data: Partial<DeviceModel>) => Promise<DeviceModel>;
export declare const updateDeviceModelsBulk: (models: DeviceModel[]) => Promise<{
    message: string;
}>;
//# sourceMappingURL=deviceInfo.d.ts.map
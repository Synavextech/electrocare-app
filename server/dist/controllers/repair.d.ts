import { Request, Response } from 'express';
export declare const scheduleRepair: (req: Request, res: Response) => Promise<void>;
export declare const getMyRepairs: (req: Request, res: Response) => Promise<void>;
export declare const updateRepairStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const acceptRepair: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=repair.d.ts.map
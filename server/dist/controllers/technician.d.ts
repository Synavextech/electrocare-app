import { Request, Response } from 'express';
export declare const listTechnicians: (req: Request, res: Response) => Promise<void>;
export declare const getMyAssignments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const acceptRepair: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=technician.d.ts.map
import { Request, Response } from 'express';
export declare const approveSale: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const approveWithdrawal: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPendingSales: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllRepairs: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getWithdrawalRequests: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=admin.d.ts.map
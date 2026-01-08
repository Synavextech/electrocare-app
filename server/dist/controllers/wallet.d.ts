import { Request, Response } from 'express';
export declare const getWallet: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const redeemPoints: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requestWithdrawal: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const redeemElectroCoins: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const topUpWallet: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=wallet.d.ts.map
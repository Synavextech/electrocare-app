import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare function validate(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map
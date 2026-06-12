import { Router, Request, Response } from 'express';
import { validate } from '../../middleware/validate.middleware';
import { registerSchema, loginSchema } from './auth.schema';
import { registerUser, loginUser } from './auth.service';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  res.status(201).json(result);
});

authRouter.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  res.json(result);
});

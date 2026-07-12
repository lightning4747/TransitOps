import { Router } from "express";
import { validate } from "../../middleware/validate";
import { loginSchema } from "./auth.schema";
import * as authService from "./auth.service";

const router = Router();

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

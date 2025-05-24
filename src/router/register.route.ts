import { Router } from "express";
import { registerUser } from "../controller/register.controller";

const router = Router()

router.route("/register").post(registerUser)

export default router
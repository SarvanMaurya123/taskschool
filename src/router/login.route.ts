import { Router } from "express";
import verifyUserJWT from "../middleware/auth.middleware";
import { logoutUser } from "../controller/logout.controller";

const router = Router()


router.route("/logout").post(verifyUserJWT, logoutUser)
export default router
import("dotenv/config");
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import registeruser from '../src/router/register.route';
import loginuser from '../src/router/login.route';
import logout from "../src/router/logout.route"
import addSchoolData from "../src/router/schoolRoutes"
const app = express();
// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS,
    methods: 'GET,POST,DELETE,PATCH,HEAD,PUT',
    credentials: true
}));

app.use(express.static('public'));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/v1", loginuser, registeruser, logout, addSchoolData)

export default app;

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import pool from '../db/dbconnection';


const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY!;

// Helper: Haversine distance formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const R = 6371; // Radius of Earth in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// ✅ POST /addSchool
export const addSchool = async (
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> => {
    const { name, address, created_by } = req.body;

    if (!name || !address) {
        res.status(400).json({ message: 'Name and address are required' });
        return;
    }

    try {
        // 🌍 Fetch coordinates using OpenCage
        const geoResponse = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
            params: {
                q: address,
                key: OPENCAGE_API_KEY,
            },
        });

        const { results } = geoResponse.data;
        if (!results.length) {
            res.status(400).json({ message: 'Invalid address or not found in geocoding' });
            return;
        }

        const { lat, lng } = results[0].geometry;

        // 📝 Insert into DB
        const query = `
            INSERT INTO schools (name, address, latitude, longitude, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [name, address, lat, lng, created_by || null];
        const result = await pool.query(query, values);

        res.status(201).json({ message: 'School added successfully', school: result.rows[0] });
    } catch (error) {
        console.error('Error in addSchool:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ✅ GET /listSchools
export const listSchools = async (
    req: Request,
    res: Response,
    _next: NextFunction
): Promise<void> => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        res.status(400).json({ message: 'Latitude and longitude are required' });
        return;
    }

    try {
        const { rows } = await pool.query('SELECT * FROM schools');

        const userLat = parseFloat(latitude as string);
        const userLon = parseFloat(longitude as string);

        const sortedSchools = rows
            .map((school) => {
                const distance = calculateDistance(
                    userLat,
                    userLon,
                    school.latitude,
                    school.longitude
                );
                return { ...school, distance };
            })
            .sort((a, b) => a.distance - b.distance);

        res.status(200).json(sortedSchools);
    } catch (error) {
        console.error('Error in listSchools:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

import { Pool } from 'pg';

const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({
    connectionString: process.env.PERIO_DATABASE_URL || process.env.DATABASE_URL,
    // Fallback to local if no connection string
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'periodontal',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    ssl: (process.env.DATABASE_URL || process.env.PERIO_DATABASE_URL)?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});

export const query = async (text: string, params?: any[]) => {
    try {
        return await pool.query(text, params);
    } catch (error: any) {
        console.error(' [DB_ERROR] ', error.message);
        throw error;
    }
};

export const getClient = () => {
    return pool.connect();
};

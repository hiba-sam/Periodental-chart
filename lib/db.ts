// lib/db.ts
import { Pool } from 'pg';

// On s'assure de ne créer qu'une seule instance du Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Configurations optionnelles recommandées pour la production :
    max: 20, // Nombre maximum de clients dans le pool
    idleTimeoutMillis: 30000, // Ferme les clients inactifs après 30s
});

export default pool;
const mysql = require('mysql2/promise');
const dbConfig = require('../config');

// Verbindung zur Datenbank herstellen
async function connectDB() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
}

async function executeStatement(statement, params = []) {
    const conn = await connectDB();
    try {
        const [results] = await conn.execute(statement, params);
        return results;
    } finally {
        try {
            await conn.end();
        } catch (_) {
            // ignore
        }
    }
}

module.exports = { connectDB: connectDB, executeStatement: executeStatement };
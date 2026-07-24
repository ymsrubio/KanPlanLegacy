require('dotenv').config();

const { Pool } = require('pg');

// Create a connection pool using the credentials from your Docker setup
const pool = new Pool({
    user: process.env.MY_SECRET_USER, // Probably 'postgres' or whatever you set
    host: 'localhost',
    database: process.env.MY_SECRET_DATABASE, // Or whatever you named your DB
    password: process.env.MY_SECRET_PASSWORD,
    port: 5432,
});

// Block 1: Import the Express library into your file
const express = require('express');

// Block 2: Create your server application (the "waiter")
const app = express();

// Block 3: Open a route
// When a GET request hits the root URL ('/'), run this function.
// 'req' is the incoming request. 'res' is your outgoing response.
app.get('/', (req, res) => {
    res.send("Hello");
});

app.get('/tasks', async (req, res) => {
    try {
        // 1. Tell the pool to execute your SQL query and 'await' the response
        const result = await pool.query('SELECT * FROM tasks;');

        // 2. Send the rows of data back to the browser as JSON (not raw text)
        res.json(result.rows)

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Server Error");
    }
});

// Block 4: Turn the server on
// Tell the app to listen for traffic on port 3000.
app.listen(3000, () => {
    console.log("port 3000 is open")
});
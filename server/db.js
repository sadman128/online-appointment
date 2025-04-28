const mysql = require('mysql2');

const pool = mysql.createPool(
    {
        host: 'mysql-taskmanger-d-taskmanager-discord.i.aivencloud.com',
        user: 'avnadmin',
        password: 'AVNS_Yv7-InPPJR6qBVfgU0W',
        database: 'hospital_appointment',
        port: 18996,
        ssl: {
            rejectUnauthorized: false
        }
});

module.exports = pool.promise();

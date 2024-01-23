// C:\nodeproject\index.js
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const url = require('url');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const port = 3001;

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cors());

const con = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'Saida&78',
    database: 'MYProject'
});

con.connect(function (err) {
    if (err) {
        console.log("Error in Connection");
    } else {
        console.log("Connected");
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.get('/getEmployee', (req, res) => {
    const sql = "SELECT * FROM employees";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Get employee error in SQL" });
        return res.json({ Status: "Success", Result: result });
    });
});

app.get('/employee/files/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT CV, image FROM employees WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Error: "Error in retrieving files" });

        if (result && result.length > 0) {
            const cvPath = result[0].CV ? `/uploads/${result[0].CV}` : null;
            const imagePath = result[0].image ? `/uploads/${result[0].image}` : null;

            return res.json({ Status: "Success", CV: cvPath, image: imagePath });
        } else {
            return res.json({ Status: "Error", Error: "No files found for the given employee ID" });
        }
    });
});

app.get('/get/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM employees WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Error: "Get employee error in SQL" });
        return res.json({ Status: "Success", Result: result });
    });
});

app.get('/getadmin/:id', (req, res) => {
    const id = req.params.id;
    console.log('Admin ID:', id);

    const sql = 'SELECT * FROM user WHERE id = ?';
    con.query(sql, [id], (err, result) => {
        if (err) {
            console.error('SQL Error:', err);
            return res.json({ Error: 'Get admin error in SQL' });
        }

        console.log('SQL Result:', result); // Add this line 

        if (result.length > 0) {
            console.log('Admin Found:', result[0]);
            return res.json({ Status: 'Success', Result: result[0] });
        } else {
            console.log('Admin Not Found');
            return res.json({ Status: 'Error', Error: 'Admin not found for the given ID' });
        }
    });
});


/*app.put('/updateadmin/:id', (req, res) => {
    const adminId = req.params.id;
    const updatedData = req.body;

    const sql = 'UPDATE user SET name=?, email=?, password=? WHERE id=?';
    con.query(sql, [updatedData.name, updatedData.email, updatedData.password, adminId], (err, result) => {
        if (err) return res.json({ Error: 'Update admin error in SQL' });

        if (result.affectedRows > 0) {
            return res.json({ Status: 'Success', Result: result });
        } else {
            return res.json({ Status: 'Error', Error: 'Admin not found for the given ID' });
        }
    });
});*/


app.put('/updateadmin/:id', (req, res) => {
    const adminId = req.params.id;
    const updatedData = req.body;
  
    let sql = 'UPDATE user SET ';
    const values = [];
  
    Object.keys(updatedData).forEach((key, index, array) => {
      sql += `${key}=?`;
      values.push(updatedData[key]);
      if (index < array.length - 1) {
        sql += ', ';
      }
    });
  
    sql += ' WHERE id=?';
    values.push(adminId);
  
    con.query(sql, values, (err, result) => {
      if (err) return res.json({ Error: 'Update admin error in SQL' });
  
      if (result.affectedRows > 0) {
        return res.json({ Status: 'Success', Result: result });
      } else {
        return res.json({ Status: 'Error', Error: 'Admin not found for the given ID' });
      }
    });
  });

app.put("/update/:id", upload.fields([{ name: 'CV', maxCount: 1 }, { name: 'image', maxCount: 1 }]), (req, res) => {
    const userId = req.params.id;
    const q = "UPDATE employees SET `name`= ?, `email`= ?, `address`= ?, `joining_date`= ?, `contact_period`= ?, `CV`= ?, `image`= ?, `salary`= ? WHERE id = ?";

    const values = [
        req.body.name,
        req.body.email,
        req.body.address,
        formatDate(req.body.joining_date),
        formatDate(req.body.contact_period),
        req.files.CV ? req.files.CV[0].path : null,
        req.files.image ? req.files.image[0].path : null,
        req.body.salary,
        userId,
    ];

    con.query(q, values, (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ Error: "Internal Server Error" });
        }
        return res.json(data);
    });
});

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace("T", " ");
}

app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM employees WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) return res.json({ Error: "Delete employee error in SQL" });
        return res.json({ Status: "Success" });
    });
});

app.get('/adminCount', (req, res) => {
    const sql = "SELECT COUNT(id) AS admin FROM user";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in running query" });
        return res.json(result);
    });
});

app.get('/employeeCount', (req, res) => {
    const sql = "SELECT COUNT(id) AS employee FROM employees";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in running query" });
        return res.json(result);
    });
});
app.get('/salary', (req, res) => {
    const sql = "SELECT SUM(salary) AS sumOfSalary FROM employees";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in running query" });
        return res.json(result);
    });
});

app.post('/createEM', upload.fields([{ name: 'CV', maxCount: 1 }, { name: 'image', maxCount: 1 }]), (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const address = req.body.address;
    const joining_date = req.body.joining_date;
    const contact_period = req.body.contact_period;
    const salary = req.body.salary;

    try {
        if (!req.files || !req.files.CV || !req.files.image) {
            return res.status(400).json({ Error: "CV and image files are required." });
        }

        const cvPath = req.files.CV[0].path;
        const imagePath = req.files.image[0].path;

        con.query(
            "INSERT INTO employees (name, email, address, joining_date, contact_period, CV, image, salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [name, email, address, joining_date, contact_period, cvPath, imagePath, salary],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send({ Error: "Internal Server Error" });
                }
                res.send(result);
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ Error: "Internal Server Error" });
    }
});

app.get('/hash', (req, res) => {
    bcrypt.hash("123456", 10, (err, hash) => {
        if (err) return res.json({ Error: "Error in hashing password" });
        return res.json({ result: hash });
    });
});

/*app.post('/login', (req, res) => {
    const sql = "SELECT * FROM user WHERE email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if (err) return res.json({ Status: "Error", Error: "Error in running query" });

        if (result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, response) => {
                if (err) return res.json({ Error: "Password error" });

                if (response) {
                    const token = jwt.sign({ role: "admin" }, "jwt-secret-key", { expiresIn: '1d' });
                    return res.json({ Status: "Success", Token: token });
                } else {
                    return res.json({ Status: "Error", Error: "Wrong Email or Password" });
                }
            });
        } else {
            return res.json({ Status: "Error", Error: "Wrong Email or Password" });
        }
    });
});*/

/////

// C:\nodeproject\index.js

// ... (Previous code)

app.get('/contractExpiryReminders', (req, res) => {
    const sql = "SELECT id, name, email, contact_period FROM employees WHERE DATEDIFF(contact_period, CURDATE()) <= 7";
    con.query(sql, (err, result) => {
        if (err) return res.json({ Error: "Error in running query" });
        return res.json({ Status: "Success", Result: result });
    });
});

// ... (Keep the rest of the server code)


app.post('/login', (req, res) => {
    const sql = "SELECT * FROM user WHERE email = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if (err) return res.json({ Status: "Error", Error: "Error in running query" });

        if (result.length > 0) {
            bcrypt.compare(req.body.password.toString(), result[0].password, (err, response) => {
                if (err) return res.json({ Error: "Password error" });

                if (response) {
                    const userId = result[0].id; // Get the user ID
                    const token = jwt.sign({ userId, role: "admin" }, "jwt-secret-key", { expiresIn: '1d' });
                    
                    // Return user ID along with the token
                    return res.json({ Status: "Success", Token: token, AdminID: userId });
                } else {
                    return res.json({ Status: "Error", Error: "Wrong Email or Password" });
                }
            });
        } else {
            return res.json({ Status: "Error", Error: "Wrong Email or Password" });
        }
    });
});

app.post('/register', (req, res) => {
    const sql = "INSERT INTO user (name, email, password) VALUES (?, ?, ?)";
    bcrypt.hash(req.body.password.toString(), 10, (err, hash) => {
        if (err) return res.json({ Error: "Error in hashing password" });

        const values = [
            req.body.name,
            req.body.email,
            hash,
        ];

        con.query(sql, values, (err, result) => {
            if (err) return res.json({ Error: "Error in query" });
            return res.json({ Status: "Success" });
        });
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


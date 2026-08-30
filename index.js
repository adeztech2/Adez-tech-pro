require("dotenv").config();

const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

const users = [];
const bots = [];
const orders = [];

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function auth(req, res, next) {
  const token = req.cookies.adez_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please login first"
    });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Session expired"
    });
  }
}

/* HOME */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

/* REGISTER */

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required"
    });
  }

  if (users.some(u => u.email === email)) {
    return res.status(400).json({
      success: false,
      message: "Email already registered"
    });
  }

  const hash = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now().toString(),
    name,
    email,
    password: hash,
    balance: 0,
    referralEarnings: 0,
    createdAt: new Date()
  };

  users.push(user);

  const token = createToken(user);

  res.cookie("adez_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  res.json({
    success: true,
    message: "Account created"
  });
});

/* LOGIN */

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password"
    });
  }

  const token = createToken(user);

  res.cookie("adez_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  res.json({
    success: true,
    message: "Login successful"
  });
});

/* LOGOUT */

app.post("/api/logout", (req, res) => {
  res.clearCookie("adez_token");

  res.json({
    success: true
  });
});

/* DASHBOARD */

app.get("/api/dashboard", auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);

  const userBots = bots.filter(b => b.userId === user.id);
  const userOrders = orders.filter(o => o.userId === user.id);

  res.json({
    success: true,

    user: {
      name: user.name,
      email: user.email
    },

    statistics: {
      balance: user.balance,
      totalBots: userBots.length,
      activeBots: userBots.filter(b => b.status === "active").length,
      orders: userOrders.length,
      referralEarnings: user.referralEarnings
    }
  });
});

/* BOTS */

app.get("/api/bots", auth, (req, res) => {
  res.json(
    bots.filter(bot => bot.userId === req.user.id)
  );
});

app.post("/api/bots", auth, (req, res) => {
  const { name, number } = req.body;

  if (!name || !number) {
    return res.status(400).json({
      success: false,
      message: "Bot name and WhatsApp number are required"
    });
  }

  const bot = {
    id: Date.now().toString(),
    userId: req.user.id,
    name,
    number,
    status: "pending",
    createdAt: new Date()
  };

  bots.push(bot);

  res.json({
    success: true,
    bot
  });
});

/* WALLET */

app.get("/api/wallet", auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);

  res.json({
    success: true,
    balance: user.balance,
    referralEarnings: user.referralEarnings
  });
});

/* ORDERS */

app.get("/api/orders", auth, (req, res) => {
  res.json(
    orders.filter(order => order.userId === req.user.id)
  );
});

/* PROFILE */

app.get("/api/profile", auth, (req, res) => {
  const user = users.find(u => u.id === req.user.id);

  res.json({
    name: user.name,
    email: user.email
  });
});

/* SERVER */

app.listen(PORT, () => {
  console.log(`ADEZ TECH PRO running on port ${PORT}`);
});

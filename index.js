const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userHandler = require('./routeHandler/userHandler');
const adminHandler = require('./routeHandler/adminHandler');

const userSchema = require('./schemas/userSchema');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const User = mongoose.models.User || mongoose.model('User', userSchema);
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

// ✅ Serve frontend from public folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ API routes
app.use('/user', userHandler);
app.use('/admin', adminHandler);

// ✅ Global error handler
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: err });
}
app.use(errorHandler);

// ✅ Optional: Default route to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const connectedUsers = new Map(); // userId => socket.id
const adminSockets = new Set();   // all connected admins
// userId => { userId, userName, status, latitude, longitude, lastUpdated }
const activeUsers = new Map();

// ✅ Socket.IO logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // User registers with their userId
  socket.on('register-user', async(userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`User registered: ${userId}`);
    try {
    const user = await User.findById(userId);
    if (user) {
      activeUsers.set(userId, {
        userId,
        userName: user.userName,
        status: "unknown",
        latitude: null,
        longitude: null,
        lastUpdated: new Date(),
      });

      // 🔥 Send updated list to all admins
      for (const admin of adminSockets) {
        admin.emit('active-users', Array.from(activeUsers.values()));
      }
    }
  } catch (err) {
    console.error("Error in register-user:", err);
  }
});
  

  // Admin registers
  socket.on('register-admin', () => {
  adminSockets.add(socket);
  console.log('Admin connected');

  // Send current list immediately
  socket.emit('active-users', Array.from(activeUsers.values()));
});


  // User sends safety status update
  socket.on("safety-status", async (data) => {
  const { userId, passcode,status,time } = data;
       let finalStatus = "unconfirmed-danger";
  try {
    const user = await User.findById(userId);
    if (status === "safe" && user && user.secretPin === passcode) {
      finalStatus = "safe";
    } else if (status === "emergency" && user && user.secretPin === passcode) {
      finalStatus = "emergency"; // ✅ confirmed-danger
    } else {
      finalStatus = "unconfirmed-danger"; // ❌ failed/missing check
    }

    const payload = {
      userId,
      userName: user?.userName || "Unknown",
      status: finalStatus,
      time,
      
    };
   console.log("✅ Safety Payload:", payload);
   if (activeUsers.has(userId)) {
  const userData = activeUsers.get(userId);
  userData.status = finalStatus;
  userData.lastUpdated = new Date();
  activeUsers.set(userId, userData);
}

  
    for (const admin of adminSockets) {
     admin.emit("active-users", Array.from(activeUsers.values()));
    }

  } catch (err) {
    console.error("Error in safety-status:", err);
  }
});
// 🟢 User sends real-time location
socket.on('location-update', (data) => {
  console.log('Received location:', data);
  if (activeUsers.has(data.userId)) {
  const userData = activeUsers.get(data.userId);
  userData.latitude = data.location.latitude;
  userData.longitude = data.location.longitude;
  userData.lastUpdated = new Date();
  activeUsers.set(data.userId, userData);
}


  // Broadcast location update to all admins
  for (const admin of adminSockets) {
   admin.emit("active-users", Array.from(activeUsers.values()));

  }
});
socket.on("user-logout", (userId) => {
  console.log("🚪 User requested logout:", userId);
  connectedUsers.delete(userId);
  activeUsers.delete(userId);

  // Notify admins
  for (const admin of adminSockets) {
    admin.emit("active-users", Array.from(activeUsers.values()));
  }
});



  // Cleanup on disconnect
 socket.on('disconnect', () => {
  console.log('Socket disconnected:', socket.id);

  // Remove only from adminSockets (if admin closed tab)
  adminSockets.delete(socket);

  // ✅ Do NOT delete from connectedUsers or activeUsers here
  // We’ll handle it explicitly on user-logout event

  // Optionally, you could add a "status: offline" if desired
});

});



const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


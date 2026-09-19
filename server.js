const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer();
const io = socketIo(server);

const users = new Map();

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);

  // Kirim daftar user beserta public key mereka ke client baru
  socket.emit("init", Array.from(users.entries()));

  socket.on("registerPublicKey", (data) => {
    const { username, publicKey } = data;
    users.set(username, publicKey);
    console.log(`${username} registered with public key.`);

    io.emit("newUser", { username, publicKey });
  });

  socket.on("message", (data) => {
    const { username, targetUsername, message, isEncrypted } = data;
    // Broadcast pesan ke seluruh client
    io.emit("message", { username, targetUsername, message, isEncrypted });
  });

  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected`);
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
// starts the server: loads env vars, connects the DB, calls app.listen()
require("dotenv").config();
const app = require("./app");
const { connectDB, disconnectDB } = require("./config/prisma");
const http = require("http");
const initSocket = require("./socket/socket");

const PORT = process.env.PORT || 6969;

const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  app.listen(() => {
    server.listen(PORT, () =>
      console.log(`Server is running on http://localhost:${PORT}`),
    );
  });
});

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

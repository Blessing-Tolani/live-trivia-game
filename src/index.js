const express = require("express")
const path = require("path")
const http = require("http")
const socketio = require("socket.io")
const formatMessage = require("./utils/formatMessage")

const {
  addPlayer,
  removePlayer,
  getPlayersByRoom,
  getPlayer,
} = require("./utils/players.js")

const app = express()
const port = 8000

const publicDirectoryPath = path.join(__dirname, "../public")
app.use(express.static(publicDirectoryPath))

const server = http.createServer(app)
const io = socketio(server)

io.on("connection", (socket) => {
  console.log("Connection established")

  socket.on("join", ({ playerName, room }, callback) => {
    const { error, newPlayer } = addPlayer({ id: socket.id, playerName, room })

    if (error) return callback(error.message)
    callback()

    socket.join(newPlayer.room)
    socket.emit("message", formatMessage("Admin", "Welcome!"))
    socket.broadcast
      .to(newPlayer.room)
      .emit(
        "message",
        formatMessage("Admin", `${newPlayer.playerName} has joined the game!`)
      )

    io.in(newPlayer.room).emit("room", {
      room: newPlayer.room,
      players: getPlayersByRoom(newPlayer.room),
    })
  })

  socket.on("disconnect", () => {
    console.log("A player disconnected.")
    const disconnectedPlayer = removePlayer(socket.id)

    if (disconnectedPlayer) {
      const { playerName, room } = disconnectedPlayer
      io.in(room).emit(
        "message",
        formatMessage("Admin", `${playerName} just left the game!`)
      )
      io.in(room).emit("room", {
        room,
        players: getPlayersByRoom(room),
      })
    }
  })

  socket.on("sendMessage", (message, callback) => {
    const { error, player } = getPlayer(socket.id)
    if (error) return callback(error.message)
    if (player) {
      io.to(player.room).emit(
        "message",
        formatMessage(player.playerName, message)
      )
      callback()
    }
  })
})

server.listen(port, () => {
  console.log(`Listening to port ${port}`)
})

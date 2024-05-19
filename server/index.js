import express from 'express'
import { Server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = "Admin"

const app = express()

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`)
})

// state variable
const UsersState = {
  users: [],
  setUsers: function(newUsersArray) {
    this.users = newUsersArray
  }
}

const io = new Server(expressServer, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500","http://127.0.0.1:5500"]
  }
})

io.on('connection', socket => {
  console.log(`USER ${socket.id} CONNECTED`)

  // welcome message for user
  socket.emit('message', buildMsg(ADMIN, "Welcome to Chat App"))

  socket.on('joinRoom', ({ name, room }) => {
    // leave previous room
    const prevRoom = getUser(socket.id)?.room

    if (prevRoom) {
      socket.leave(prevRoom)
      io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`))
    }

    const user = userJoin(socket.id, name, room)

    // update prevRoom state list
    if (prevRoom) {
      io.to(prevRoom).emit('userList', {
        users: getUsersInRoom(prevRoom)
      })
    }

    // join new room
    socket.join(user.room)

    // entrance messages
    socket.emit('message', buildMsg(ADMIN, `You have joined the ${user.room} chat room`))
    socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined`))

    // update user lists
    io.to(user.room).emit('userList', {
      users: getUsersInRoom(user.room)
    })

    io.emit('roomList', {
      rooms: getRooms()
    })
  })

  // disconnect message for all others
  socket.on('disconnect', () => {
    const user = getUser(socket.id)
    userLeave(socket.id)

    if (user) {
      io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`))

      io.to(user.room).emit('userList', {
        users: getUsersInRoom(user.room)
      })

      io.emit('roomList', {
        rooms: getRooms()
      })
    }
    
    console.log(`USER ${socket.id} DISCONNECTED`)
  })

  // listens for message event
  socket.on('message', ({name, text}) => {
    const room = getUser(socket.id)?.room
    if (room) {
      io.to(room).emit('message', buildMsg(name, text))
    }
  })

  // listen for activity event
  socket.on('activity', (name) => {
    const room = getUser(socket.id)?.room
    if (room) {
      socket.broadcast.to(room).emit('activity', name)
    }
  })

})

function buildMsg(name, text) {
  console.log(`[${name}] ${text}`)
  return {
    name,
    text,
    time: new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    }).format(new Date())
  }
}

// user functions
function userJoin(id, name, room) {
  const user = { id, name, room }
  UsersState.setUsers([
    ...UsersState.users.filter(user => user.id !== id),
    user
  ])
  return user
}

function userLeave(id) {
  UsersState.setUsers(
    UsersState.users.filter(user => user.id !== id)
  )
}

function getUser(id) {
  return UsersState.users.find(user => user.id === id)
}

function getUsersInRoom(room) {
  return UsersState.users.filter(user => user.room === room)
}

function getRooms() {
  return Array.from(new Set(UsersState.users.map(user => user.room)))
}
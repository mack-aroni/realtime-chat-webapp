const socket = io('ws://localhost:3500')

const msgInput = document.querySelector('#message')
const nameInput = document.querySelector('#name')
const roomInput = document.querySelector('#room')
const activity = document.querySelector('.activity')
const userList = document.querySelector('.user-list')
const roomList = document.querySelector('.room-list')
const chatDisplay = document.querySelector('.chat-display')

// sends message over socket
function sendMessage(e) {
  e.preventDefault()
  if (nameInput.value && msgInput.value && roomInput.value) {
    socket.emit('message', {
      name: nameInput.value,
      text: msgInput.value
    })
    console.log(`[${nameInput.value}] ${msgInput.value}`)
    msgInput.value = ""
  }
  msgInput.focus()
}

// enters a room
function joinRoom(e) {
  e.preventDefault()
  if (nameInput.value && roomInput.value) {
    socket.emit('joinRoom', {
      name: nameInput.value,
      room: roomInput.value
    })
  }
}

document.querySelector('.form-msg').addEventListener('submit', sendMessage)

document.querySelector('.form-join').addEventListener('submit', joinRoom)

// user activity listener
msgInput.addEventListener('keypress', () => {
  socket.emit('activity', nameInput.value)
})

// listen for messages 
socket.on("message", (data) => {
  activity.textContent = ""
  const { name, text, time } = data
  const li = document.createElement('li')
  li.className = 'post'
  if (name === nameInput.value) li.className = 'post post--left'
  if (name !== nameInput.value && name !== 'Admin') li.className = 'post post--right'
  if (name !== 'Admin') {
      li.innerHTML = `<div class="post__header ${name === nameInput.value
          ? 'post__header--user'
          : 'post__header--reply'
          }">
      <span class="post__header--name">${name}</span> 
      <span class="post__header--time">${time}</span> 
      </div>
      <div class="post__text">${text}</div>`
  } else {
      li.innerHTML = `<div class="post__text">${text}</div>`
  }
  document.querySelector('.chat-display').appendChild(li)

  chatDisplay.scrollTop = chatDisplay.scrollHeight
})

// server listeners
let activityTimer
socket.on('activity', (name) => {
  activity.textContent = `${name} is typing...`
  // listener timer (2 seconds)
  clearTimeout(activityTimer)
  activityTimer = setTimeout(() => {
    activity.textContent = ""
  }, 2000)
})

socket.on('userList', ({users}) => {
  showUsers(users)
})

socket.on('roomList', ({rooms}) => {
  showRooms(rooms)
})

// update users list
function showUsers(users) {
  userList.textContent = ''
  if (users) {
    userList.innerHTML = `<em>Users in ${roomInput.value}:</em>`
    users.forEach((user, i) => {
      userList.textContent += ` ${user.name}`
      if (users.length > 1 && i !== users.length-1) {
        userList.textContent += ','
      }
    })
  }
}

// update rooms list
function showRooms(rooms) {
  roomList.textContent = ''
  if (rooms) {
    roomList.innerHTML = `<em>Active Rooms:</em>`
    rooms.forEach((room, i) => {
      roomList.textContent += ` ${room}`
      if (rooms.length > 1 && i !== rooms.length-1) {
        roomList.textContent += ','
      }
    })
  }
}
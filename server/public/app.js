const socket = io('ws://localhost:3500')

const activity = document.querySelector('.activity')
const msgInput = document.querySelector('input')

// sends message over socket
function sendMessage(e) {
  e.preventDefault()
  if (msgInput.value) {
    socket.emit('message', msgInput.value)
    msgInput.value = ""
  }
  msgInput.focus()
}

document.querySelector('form').addEventListener('submit', sendMessage)

// listen for message over sockets
socket.on('message', (data) => {
  const li = document.createElement('li')
  li.textContent = data
  document.querySelector('ul').appendChild(li)
})

// user activity listener
let activityTimer
msgInput.addEventListener('keypress', () => {
  socket.emit('activity', socket.id.substring(0,5))
})

socket.on('activity', (name) => {
  activity.textContent = `${name} is typing...`

  // listener timer (3 seconds)
  clearTimeout(activityTimer)
  activityTimer = setTimeout(() => {
    activity.textContent = ""
  }, 2000)
})
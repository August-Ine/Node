const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()

//parse json using express middleware
app.use(express.json())

//serve up public dir
const publicDir = path.join(__dirname, '../public')
app.use(express.static(publicDir))

const server = http.createServer(app)

//websocket
const io = socketio(server)

io.on('connection', (socket) => {
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('newMessage', generateMessage('Welcome!', 'Admin'))

        socket.broadcast.to(user.room).emit('newMessage', generateMessage(`${user.username} has joined`, 'Admin'))

        //send room details to all
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
    })

    socket.on('messageSent', (message, callback) => {
        //new instance of bad-words Filter
        const filter = new Filter()

        //check profanity
        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        }
        //no profanity
        //get user
        const user = getUser(socket.id)

        io.to(user.room).emit('newMessage', generateMessage(message, user.username))
        callback()
    })

    socket.on('sendLocation', ({ latitude, longitude }, callback) => {
        //get user
        const user = getUser(socket.id)
        io.emit('locationMessage', generateMessage(`https://google.com/maps?q=${latitude},${longitude}`, user.username))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('newMessage', generateMessage(`${user.username} has left`))
        }
    })
})

server.listen(3000, () => {
    console.log("app listening on port 3000")
})

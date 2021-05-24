const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const cors = require('cors')
const PORT = process.env.PORT || 5000;

app.set('view engine', 'ejs')
app.use(express.static('assets'))
app.use(express.urlencoded({ extended: true }))
app.use(cors())
const rooms = {}

app.get('/', (req, res) => {
    res.render('index', { rooms })
})

app.post('/room', (req, res) => {
    if (rooms[req.body.room] != null) {
        return res.redirect('/')
    }
    rooms[req.body.room] = { users: {},messages:[] }
    res.redirect("/room/" + req.body.room)
        // Send message that new room was created
    io.emit('room-created', {room:req.body.room,users:rooms[req.body.room].users})
})

app.get('/room/:room', (req, res) => {
    if (rooms[req.params.room] == null) {
        return res.redirect('/')
    }
    res.render('room', { roomName: req.params.room })
})

server.listen(PORT)

io.on('connection', socket => {
    socket.on('new-user', (room, name) => {
        socket.join(room)
        rooms[room].users[socket.id] = name
        io.emit("user-count-update",{room,count:Object.keys(rooms[room].users).length})
        socket.to(room).broadcast.emit('user-connected', name)
    })
    socket.on('send-chat-message', (room, message) => {
        console.log(rooms);
        rooms[room].messages.push({message,name:rooms[room].users[socket.id]})
        socket.to(room).broadcast.emit('chat-message', { message: message, name: rooms[room].users[socket.id] })
    })
    socket.on('disconnect', () => {
        getUserRooms(socket).forEach(room => {
            socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
            delete rooms[room].users[socket.id]
            io.emit("user-count-update",{room,count:Object.keys(rooms[room].users).length})
            if (Object.keys(rooms[room].users).length === 0) {
                console.log("Room deleted");
                delete rooms[room];
                console.log(rooms)
                io.emit("room-deleted", rooms)
            }
            
            socket.disconnect();
        })
    })
})

function getUserRooms(socket) {
    return Object.entries(rooms).reduce((names, [name, room]) => {
        if (room.users[socket.id] != null) names.push(name)
        return names
    }, [])
}
const socket = io('http://localhost:5000')
const messageContainer = document.querySelector('.chat-thread')
const roomContainer = document.getElementById('room-container')
const messageForm = document.querySelector('.chat-window')
const messageInput = document.querySelector('.chat-window-message')

if (messageForm != null) {
    let name = prompt('Kullanıcı Adı?')
    while (!name) {
        name = prompt('Kullanıcı Adı?')
    }
    appendAlert("Katıldınız");
    socket.emit('new-user', roomName, name)

    messageForm.addEventListener('submit', e => {
        e.preventDefault()
        const message = messageInput.value
        appendMessage(`${message}`)
        socket.emit('send-chat-message', roomName, message)
        messageInput.value = ''
        return false;
    })
}

socket.on('room-created', roomInfo => {
    const {room} = roomInfo
    console.log(roomInfo);
    const roomElement = document.createElement('li')
    roomElement.dataset.roomName = room;
    const roomName = document.createElement('span')
    roomName.classList.add("room-name")
    roomName.innerHTML = room;
    const userCount = document.createElement('span')
    userCount.classList.add("room-user-count")
    userCount.innerHTML = Object.keys(roomInfo.users).length;
    const roomLink = document.createElement('a')
    roomLink.href = `/room/${room}`
    roomLink.innerText = 'Katıl'
    roomElement.appendChild(roomName)
    roomElement.appendChild(userCount)
    roomElement.appendChild(roomLink)
    roomContainer.append(roomElement)
    document.querySelector(".room-alert").remove()
})
socket.on("user-count-update",data => {
    console.log("aaa");
    const roomElement = document.querySelector(`[data-room-name=${data.room}]`)
    console.log(roomElement,data);
    if(roomElement){
        roomElement.querySelector(".room-user-count").setAttribute("title",`${data.count} kullanıcı şuan bu odada.`)
        roomElement.querySelector(".room-user-count").innerHTML = data.count;
    }
})

socket.on('chat-message', data => {
    appendMessage(data.message, false, data.name)
})

socket.on('user-connected', name => {
    appendAlert(`${name} katıldı.`)
})
socket.on('room-deleted', rooms => {
    [...roomContainer.querySelectorAll("li")].forEach(el => el.remove())
    if(Object.keys(rooms).length > 0){
        Object.keys(rooms).forEach(room => {
            const roomElement = document.createElement('li')
            const roomName = document.createElement('span')
            roomName.innerHTML = room;
            const roomLink = document.createElement('a')
            roomLink.href = `/room/${room}`
            roomLink.innerText = 'Katıl'
            roomElement.appendChild(roomName)
            roomElement.appendChild(roomLink)
            roomContainer.append(roomElement)
        })
    }else{
        const alertMessage = document.createElement("div");
        alertMessage.classList.add("room-alert")
        alertMessage.innerHTML = "Herhangi bir oda bulunamadı"
        roomContainer.append(alertMessage)
    }
})
socket.on('user-disconnected', name => {
    appendAlert(`${name} ayrıldı.`)
})

function appendAlert(message) {
    const messageElement = document.createElement('div')
    const alertContainer = document.createElement("li")
    messageElement.classList.add("alert");
    alertContainer.classList.add("alert-container")
    alertContainer.appendChild(messageElement)
    messageElement.innerText = message
    messageContainer.append(alertContainer)
    appendSpace()
}
function appendSpace(){
    const spaceEl = document.createElement('li');
    spaceEl.classList.add("space")
    messageContainer.append(spaceEl)
}
function appendMessage(message, you = true, user = null) {
    const messages = [...messageContainer.children];
    const lastMessage = messages[messageContainer.childElementCount - 1];
    const messageElement = document.createElement('li')
    if (user !== null) {
        const userElement = document.createElement('span');
        userElement.innerText = user;
        messageElement.classList.add("user")
        messageElement.dataset.username = user;
        if(lastMessage.dataset.username && lastMessage.dataset.username === user){
            messageElement.classList.add("neighbor")
            userElement.remove()
        }else{
            messageElement.append(userElement)
            appendSpace()
        }
    }
    if (you){
        messageElement.classList.add('you');
        if(lastMessage.classList.contains('you')){
            messageElement.classList.add("neighbor")
        }
    }
    messageElement.innerHTML += message
    messageContainer.append(messageElement)
}
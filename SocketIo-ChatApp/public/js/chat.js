const socket = io()

//select elements
const $messageForm = document.querySelector('#message-form')
const $messageDisplay = document.querySelector('#message-display')
const $locationButton = document.querySelector('#location-button')
const $submitButton = $messageForm.querySelector('button')
const $formInput = $messageForm.querySelector('input')
const $messages = document.querySelector('#messages')
const $roomContainer = document.querySelector('#room-container')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const roomTemplate = document.querySelector('#room-template').innerHTML

//send query params
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })
console.log(username, room)
socket.emit('join', { username, room }, (e) => {
    alert(e)
    location.href = '/' //redirect to index
})

//autoscroll messages
const autoScroll = () => {
    //get new message element
    const $newMessage = $messages.lastElementChild

    //get total height of new message
    const newMessagesStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessagesStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height (constant)
    const visibleHeight = $messages.offsetHeight

    //total height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    //check if we were at bottom before new message
    if (containerHeight - newMessageHeight <= scrollOffset) {
        //scroll
        $messages.scrollTop = $messages.scrollHeight
    }
}

//form submit
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $submitButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value

    //emit event
    socket.emit('messageSent', message, (e) => {
        $formInput.value = ''
        $formInput.focus()
        $submitButton.removeAttribute('disabled')
        if (!e) { return }
        $messageDisplay.innerHTML = e
    })
})

//share location
$locationButton.addEventListener('click', () => {
    //access geo api
    if (!navigator.geolocation) {
        return alert('Geolocation not supported on browser')
    }
    $locationButton.setAttribute('disabled', 'disabled')
    //fetch location
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', { latitude: position.coords.latitude, longitude: position.coords.longitude }, () => {
            $locationButton.removeAttribute('disabled')
        })
    })
})

//receive new message event
socket.on('newMessage', (message) => {
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

//location message
socket.on('locationMessage', (link) => {
    const html = Mustache.render(locationTemplate, {
        link: link.text,
        createdAt: moment(link.createdAt).format('h:mm a'),
        username: link.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

//room details
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(roomTemplate, { room, users })
    $roomContainer.innerHTML = html
})
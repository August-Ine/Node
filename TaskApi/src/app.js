const express = require('express')
const usersRouter = require('./routers/userRouter')
const tasksRouter = require('./routers/taskRouter')

const app = express()

//parse incoming json
app.use(express.json())

app.use(usersRouter)
app.use(tasksRouter)

module.exports = app
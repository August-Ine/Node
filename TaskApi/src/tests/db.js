const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Task = require('../models/task')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id: userOneId,
    name: 'test',
    email: 'test@test.com',
    password: 'password123',
    tokens: [{
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
}

const userTwoId = new mongoose.Types.ObjectId()
const userTwo = {
    _id: userTwoId,
    name: 'test2',
    email: 'test2@test.com',
    password: 'P@$$w0rd321',
    tokens: [{
        token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET)
    }]
}

//user one tasks
const taskOneId = new mongoose.Types.ObjectId()
const taskOne = {
    _id: taskOneId,
    description: 'User one task one',
    completed: false,
    owner: userOneId
}

const taskTwo = {
    description: 'User one task two',
    completed: true,
    owner: userOneId
}

//user two task
const taskThree = {
    description: 'User two task one',
    completed: false,
    owner: userTwoId
}



//set up db for tests
const configDb = async () => {
    await User.deleteMany() //clear db
    await Task.deleteMany()

    await new User(userOne).save() // create test users and tasks
    await new User(userTwo).save()
    await new Task(taskOne).save()
    await new Task(taskTwo).save()
    await new Task(taskThree).save()
}

module.exports = {
    userOneId,
    userOne,
    taskOneId,
    userTwo,
    configDb
}
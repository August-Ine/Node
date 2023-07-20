const request = require('supertest')
const app = require('../app')
const Task = require('../models/task')
const { userOne, userOneId, taskOneId, userTwo, configDb } = require('./db')

//set up db, before each test case
beforeEach(async () => {
    await configDb()
})

//test create task
test('Should create task for authenticated user', async () => {
    const response = await request(app)
        .post('/tasks')
        .send({
            description: 'new task',
            completed: false
        })
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .expect(201)

    //check task in db
    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull
})

//affirm userOne has two tasks
test('UserOne should have two tasks', async () => {
    const response = await request(app)
        .get('/tasksAll')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .expect(200)

    expect(response.body.length).toBe(2)
    //in db
    const tasks = await Task.find({ owner: userOneId })
    expect(tasks.length).toBe(2)
})

//affirm cannot delete another user's task
test('Should not delete another users task', async () => {
    //delete userOne's taskOne as userTwo
    await request(app)
        .delete('/tasks/' + taskOneId)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .expect(404)

    //assert task is still in db
    const task = await Task.findById(taskOneId)
    expect(task).not.toBeNull
})
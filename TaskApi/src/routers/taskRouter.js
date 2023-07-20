const express = require('express')
require('../db/mongoose') // connect to db
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

//endpoints

//create task
router.post('/tasks', auth, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            owner: req.user._id,
            ref: 'User'
        })
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(500).send()
    }
})

//get task by id
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const _id = req.params.id
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

//get authenticated user's tasks
router.get('/tasksAll', auth, async (req, res) => {
    try {
        let match = {}
        if (req.query.completed) {
            match.completed = req.query.completed === 'true'
        }

        let sort = {}
        if (req.query.sortBy) {
            // ?sortBy=createdAt_desc
            const parts = req.query.sortBy.split('_')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }
        const user = await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        })
        res.send(user.tasks)
    } catch (e) {
        res.status(500).send(e)
    }
})

//update a task by id
router.patch('/tasks/:id', auth, async (req, res) => {
    const allowedUpdates = ['description', 'completed']
    const updates = Object.keys(req.body)
    const isAllowed = updates.every(update => allowedUpdates.includes(update))
    if (!isAllowed) {
        return res.status(400).send({ error: 'Invalid updates' })
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        updates.forEach(update => task[update] = req.body[update])
        task.save()
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

//delete task by id
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.deleteOne({ _id: req.params.id, owner: req.user._id })
        if (task.deletedCount === 0) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
})


module.exports = router
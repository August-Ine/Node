const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
require('../db/mongoose') // connect to db
const User = require('../models/user')
const auth = require('../middleware/auth')

const router = new express.Router()

//multer
const upload = multer({
    limits: {
        fileSize: 1000000 //bytes
    },
    fileFilter(req, file, cb) {
        // .jpg .jpeg .png
        if (!file.originalname.match(/\.(jpeg|jpg|png)$/)) {
            return cb(new Error('provide image file in png, jpeg or jpg format'))
        }
        cb(undefined, true)
    }
})

//endpoints

//create user
router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body)
        const token = await user.generateAuthToken()
        await user.save()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(500).send(e)
    }
})

//login user with email, password
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

//get user's profile by id
router.get('/users/me', auth, async (req, res) => {
    try {
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

//update profile 
router.patch('/users/me', auth, async (req, res) => {
    //fields user is allowed to update
    const allowedUpdates = ['name', 'age', 'email', 'password']
    const updates = Object.keys(req.body) //fields user is updating
    const isAllowed = updates.every(update => allowedUpdates.includes(update)) //only true if all updates are allowed
    if (!isAllowed) {
        return res.status(400).send({ error: 'invalid updates' })
    }
    try {
        updates.forEach(update => req.user[update] = req.body[update])//update fields
        //save changes
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

//upload avatar photo
router.post('/users/me/avatar', auth, upload.single('upload'), async (req, res) => {
    //modify picture using sharp
    const buffer = await sharp(req.file.buffer).png().resize({ width: 250, height: 250 }).toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (err, req, res, next) => {
    //handle error
    res.status(400).send({ error: err.message })
})

//serve up avatar
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        //set header
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

//delete avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//delete authenticated user
router.delete('/users/me', auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

//logout
router.post('/users/logout', auth, async (req, res) => {
    //target specific token used to login this device
    try {
        //remove token from token array
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

//logout of all devices
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})





module.exports = router
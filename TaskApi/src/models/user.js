const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('../models/task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    age: {
        type: Number,
        required: true,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number.')
            }
        }
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Enter a valid email.')
            }
        }
    },
    password: {
        type: String,
        required: true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

//password hashing middleware
userSchema.pre('save', async function (next) {
    const user = this
    //check if password field was modified
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
        next()
    }
    next()
})

//format profile data
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject //this will be the object that will be stringified by res.send
}

//relationship with tasks
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//delete associated tasks for a user being removed
userSchema.post('findOneAndDelete', async function (user, next) {
    const task = await Task.deleteMany({ owner: user._id })
    next()
})

//check credentials
userSchema.statics.findByCredentials = async (email, password) => {
    //find user by email
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error('unable to login')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error('unable to login')
    }
    //password is a match
    return user
}

//generate jwt
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token }) //add to user's token array
    await user.save()
    return token
}

const User = mongoose.model('User', userSchema)

module.exports = User
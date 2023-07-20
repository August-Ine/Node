const request = require('supertest')
const app = require('../app')
const User = require('../models/user')
const { userOneId, userOne, configDb } = require('./db')


//jest lifecycle method
beforeEach(async () => {
    await configDb()
})

//sign up
test('Should sign up new user', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'augustine',
            email: 'example@email.com',
            password: 'abdcdef124'
        })
        .expect(201)

    //assert user was saved to db
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    //assert user and token returned
    expect(response.body).toMatchObject({
        user: {
            name: 'augustine',
            email: 'example@email.com'
        },
        token: user.tokens[0].token
    })

    //assert db password is not plain text password
    expect(user.password).not.toBe('abcdef124')
})

//login
test('Should login existing user', async () => {
    await request(app)
        .post('/users/login')
        .send(userOne)
        .expect(200)
})

//bad login credentials
test('Should not login bad credentials', async () => {
    await request(app)
        .post('/users/login')
        .send({
            name: 'unknown',
            password: 'badpass'
        })
        .expect(400)
})

//test auth token
test('Should get profile for user using token', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .expect(200)
})

//test no auth
test('Should not get profile request without token', async () => {
    await request(app)
        .get('/users/me')
        .expect(401)
})

//test delete user with auth token
test('Should delete user with auth token', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .expect(200)
})

//test delete user without auth token
test('Should not delete user without auth token', async () => {
    await request(app)
        .delete('/users/me')
        .expect(401)
})

//assert new token is saved to db on login
test('Should save second token to db on login', async () => {
    const response = await request(app)
        .post('/users/login')
        .send(userOne)
        .expect(200)

    const user = await User.findById(response.body.user._id)
    expect(user.tokens.length).toBe(2)
})

//assert deleted user is null in db
test('Should delete user on db when authenticated user is deleted', async () => {
    const response = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    const user = await User.findById(userOneId)
    expect(user).toBeNull
})

//test avatar upload
test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('upload', 'C:/Users/augustine/Desktop/Node/TaskApi/src/tests/fixtures/passphoto.jpg', 'passphoto.jpg')
        .expect(200)

    //check binary data was saved to db
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

//test user update
test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .send({
            name: 'changed',
            email: 'changed@change.com'
        })
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .expect(200)

    //verify in db
    const user = await User.findById(userOneId)
    expect(user.name).toBe('changed')
    expect(user.email).toBe('changed@change.com')
})

//test update invalid fields 
test('Should not allow update invalid fields', async () => {
    await request(app)
        .patch('/users/me')
        .send({
            location: 'Brazil',
            gender: 'male'
        })
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .expect(400)
})
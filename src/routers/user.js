const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middlewares/auth')
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account')

const router = new express.Router()

//sign up
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        await user.hashPassword()
        const token = await user.generateAuthenticationToken()
        sendWelcomeEmail(user.name, user.email)
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})
//log in
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthenticationToken()
        
        res.send({user, token})
    }catch (e) {
        res.status(400).send(e)
    }
})
//upload avatar
const upload = multer({
    limits: {
        fileSize: 1000000
     },
    fileFilter(req, file, callback){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Please upload an image'))
        }
        callback(undefined, true)
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    try{
        const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().buffer()
        await req.user.save()
        res.send()
    }catch (error) {
        res.status(500).send()
    }  
},(error, req, res, next) => {
    res.status(400).send({error: error.message})
} )
//logout
router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((tokenObject) => {
            return tokenObject.token !== req.token
        })
        await req.user.save()
        res.send(req.user)
    }catch (e) {
        res.status(500).send()
    }
})
//logout All
router.post('/users/logoutAll', auth, async (req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send(req.user)
    }catch (e) {
        res.status(500).send()
    }
})
//need to remove
//all user
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({})
        res.send(users)
    } catch (e) {
        res.status(500).send()
    }
})
//user Profile
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})
//user Profile avatar by id
router.get('/users/:id/avatar', async(req, res) => {
    const user = User.findById(req.params.id)

    if(!user || !user.avatar) {
        throw new Error()
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
})
//update Profile
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    const isPasswordIncluded = updates.includes('password')

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }
    
    try {
        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()
        if (isPasswordIncluded){
            await req.user.hashPassword()
        }
        res.send(req.user)         
    } catch (e) {
        res.status(400).send(e)
    }
})
//delete Profile
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.name, req.user.email)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})
//delete avatar
router.delete('/users/me/avatar', auth, async(req, res) => {
    try{
        req.user.avatar = undefined
        await req.user.save()
        res.send()
    }catch(e) {
        res.status(500).send()
    }
})

module.exports = router
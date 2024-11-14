if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}


const PORT = 3000
const mongoose = require('mongoose')
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const initPassport = require('./passport')


initPassport(
    passport, 
    email => User.findOne({email}),
    id => User.findById(id)
)


app.set('view-engine', 'ejs')
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session(
    {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false

    }
))

mongoose.connect(process.env.url, {
    useUnifiedTopology: true
})
.then(() => console.log('Database Connected...'))
.catch((err) => console.error('MongoDB connection error:', err))



// model
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required:true,
        unique: true,
    },
    password: {
        type: String,
        required:true,
    }
}) 

const User = mongoose.model('User', userSchema)
module.exports = User;


app.use(passport.initialize())
app.use(passport.session())



app.get('/', checkAuth, (req,res) => {
    res.render('index.ejs', {name: req.user.name})
})

app.get('/login', checkNotAuth, (req, res) => {
    res.render('login.ejs')
})

app.post('/login', checkNotAuth, passport.authenticate('local',{
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/register', checkNotAuth, (req, res) => {
    res.render('register.ejs')
})

app.post('/register', checkNotAuth, async (req, res) => {

    const {name, email, password} = req.body;



    try {
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.redirect('/login')
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        const newUser = new User ({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save()

        res.redirect('/login');
    } catch (err) {
        console.error(error);
        res.redirect('/register')
    }
})

function checkAuth(req,res, next){
    if(req.isAuthenticated()){
         return next()
    }

    res.redirect('/login')
}

function checkNotAuth(req,res, next){
    if(req.isAuthenticated()){
        return res.redirect('/')
    }
    
    next()
}



app.listen(PORT, () => {
    console.log(`BIG TONKA SERVER LIVE! http://localhost:${PORT}`)
})


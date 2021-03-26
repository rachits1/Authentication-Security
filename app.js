require('dotenv').config()
const express = require('express');

const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const app = express();
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

app.use(session({
    secret: 'My Secret Key.',
    resave: false,
    saveUninitialized: true,
  }))

app.use(passport.initialize());
app.use(passport.session());



mongoose.connect('mongodb://localhost:27017/usersDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const usersSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
});

usersSchema.plugin(passportLocalMongoose);
usersSchema.plugin(findOrCreate);

const User = mongoose.model('User',usersSchema);

passport.use(User.createStrategy());

// Used only when we are using sessions,(serialize to generate a cookie)
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get('/',(req,res)=>{
    res.render('home');
})

// This is the callback we added on our google project
app.get('/auth/google',
  passport.authenticate("google", { scope: ["profile"] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/secrets');
  });

app.get('/login',(req,res)=>{
    res.render('login');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.get('/secrets',(req,res)=>{
    User.find({"secret": {$ne: null}},(err,foundSecrets)=>{
        if(err){
            console.log(err);
        } else {
            if(foundSecrets){
                res.render('secrets',{submittedSecrets:foundSecrets});
            }
        }
    })
})

app.get('/submit',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('submit'); 
    } else {
        res.redirect('/login');
    }
})

app.post('/submit',(req,res)=>{
    const secret = req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                foundUser.secret = secret;
                foundUser.save(()=>{
                    res.redirect('/secrets')
                })
            }
        }
    })
})

app.get('/logout',(req,res)=>{
    req.logout();
    res.redirect('/');
})


app.post('/register',(req,res)=>{
   User.register({username: req.body.username},req.body.password,(err,user)=>{
       if(err){
           console.log(err);
           res.redirect('/register');
       } else{
           passport.authenticate("local")(req,res,()=>{
                res.redirect('/secrets');
           })    
        }
   })
})

app.post('/login',(req,res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user,(err)=>{
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res,()=>{
                res.redirect('/secrets');
            })
        }
    })
})

app.listen(3000,()=>{
    console.log('Listening on port 3000');
})
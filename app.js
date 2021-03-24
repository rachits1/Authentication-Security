require('dotenv').config()
const express = require('express');
const app = express();
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/usersDB', {useNewUrlParser: true, useUnifiedTopology: true});
const encrypt = require('mongoose-encryption');
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

const usersSchema = new mongoose.Schema({
    email: String,
    password: String 
});

usersSchema.plugin(encrypt, { secret: process.env.SECRET , encryptedFields:['password']});

const User = mongoose.model('User',usersSchema);

app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/login',(req,res)=>{
    res.render('login');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.post('/register',(req,res)=>{
    const email = req.body.username;
    const pass = req.body.password;
    const newUser = new User({
        email: email,
        password: pass
    });
    newUser.save((err)=>{
        if(err){
            console.log(err);
        } else {
            res.render('secrets');
        }
    });

})

app.post('/login',(req,res)=>{
    const username = req.body.username;
    const pass = req.body.password;
    User.findOne({email:username},(err,foundUser)=>{
        if(err){
            console.log(err);
        } else{
            if(foundUser){
                if(foundUser.password === pass){
                    res.render('secrets');
                }
            }
        }
    })
})

app.listen(3000,()=>{
    console.log('Listening on port 3000');
})
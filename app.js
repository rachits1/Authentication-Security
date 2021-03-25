require('dotenv').config()
const express = require('express');
const app = express();
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/usersDB', {useNewUrlParser: true, useUnifiedTopology: true});
const bcrypt = require('bcrypt');
const saltRounds = 10;
app.set('view engine','ejs');
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));

const usersSchema = new mongoose.Schema({
    email: String,
    password: String 
});



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
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const email = req.body.username;
        const pass = hash;
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
                bcrypt.compare(pass, foundUser.password, function(err, result) {
                    if (result === true){
                        res.render('secrets');
                    }
                });
            }
        }
    })
})

app.listen(3000,()=>{
    console.log('Listening on port 3000');
})
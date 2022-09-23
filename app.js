
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res){
    res.render("home");
});


// Start of 'login' route //

app.route("/login")
   
    .get(function(req, res){
        res.render("login");
    })

    .post(function(req, res){

        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function(err){
            if (err){
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
        });
    });

// End of 'login' route //


// Start of 'register' route //

app.route("/register")

    .get(function(req, res){
        res.render("register");
    })

    .post(function(req, res){

        User.register({username: req.body.username}, req.body.password, function(err, user){
            if(err){
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                });
            }
        });

    });

// End of 'register' route //

app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});


app.get("/logout", function(req, res){
    req.logout(function(err){
        if (err){
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});




app.listen(3000, function(){
    console.log("Server started on port 3000");
});
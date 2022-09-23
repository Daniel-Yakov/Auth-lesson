
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id); 
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// Add the passport-google middleware to passport
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // find if googleId already exists or create if not
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
    passport.authenticate('google', { failureRedirect: "/login" }),
    function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
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
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    })
});

app.get("/submit", function(req, res){
    if (req.isAuthenticated()){
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function(req, res){
    const secretPosted = req.body.secret;

    User.findById(req.user.id, function(err, foundUser){
        if (err){
            console.log(err);
        } else {
            foundUser.secret = secretPosted;
            foundUser.save(function(){
                res.redirect("/secrets");
            });
        }
    });
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
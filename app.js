
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5"); // hash encryption
const bcrypt = require('bcrypt'); // bycrypt hash encryption
const saltRounds = 10;


const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Add encryption to the 'password'
//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);


app.get("/", function(req, res){
    res.render("home");
});


// Start of 'login' route //

app.route("/login")
   
    .get(function(req, res){
        res.render("login");
    })

    .post(function(req, res){
        const userName = req.body.username;
        const password = req.body.password;

        // Checking if the userName exists in the DB
        User.findOne({email: userName}, function(err, foundUser){
            if (err){
                console.log(err);
            } else {
                // The userName indeed exists in the DB
                if (foundUser){
                    // iF the password typed matches the password in DB, login.
                    bcrypt.compare(password, foundUser.password, function(err, result) {
                        if(result === true){
                            res.render("secrets");
                        }
                    });
                }
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

        // This will encrypt the password with the bcrypt encryption
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            // Create the new user date
            const newUser = new User({
                email: req.body.username,
                password: hash
            })
            // Add the data to userDB
            .save(function(err){
                if(err){
                    console.log(err);
                } else {
                    res.render("secrets");
                }
            });
        });
    });

// End of 'register' route //










app.listen(3000, function(){
    console.log("Server started on port 3000");
});
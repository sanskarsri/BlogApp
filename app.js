//jshint esversion:6
require('dotenv').config()
const dotenv=require('dotenv');
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "Author Sanskar.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://sanskar:database.find()@firstdatabase.5taea.mongodb.net/blog_web',{useNewUrlParser: true});
// mongoose.connect('mongodb://localhost:27017/blog_web', {useNewUrlParser: true});

const postSchema = new mongoose.Schema({
   title: String,
   blog: String,
   author: String,
   author_id: String,
   date: String
});

const userSchema = new mongoose.Schema({
  username: String,
  // email: String,
  password: String,
  googleId: String,
  githubId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Post = mongoose.model("post",postSchema);
const User = mongoose.model("user",userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
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
  callbackURL: "https://blog0703.herokuapp.com/auth/google/BlogPost",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id , username: profile._json.given_name}, function (err, user) {
  
    // console.log(user);

    return cb(err, user);
  });
}
));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "https://blog0703.herokuapp.com/auth/github/BlogPost"
},
function(accessToken, refreshToken, profile, done) {
  User.findOrCreate({ githubId: profile.id, username: profile.username }, function (err, user) {
    // console.log(profile);
    return done(err, user);
  });
}
));

const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";


app.get("/",function(req,res){
  
  let name = "user";
  let link="#";
  if(req.isAuthenticated())
  {
    name = req.user.username;
    link = req.user._id;
  }
  

  Post.find({},  {}, { sort: { 'created_at' : -1 } },function(err,blogs){
    res.render("home",{para_content: homeStartingContent, posts: blogs,name: name,p_link: link});
  }).sort({date:-1});
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
  );

  app.get("/auth/google/BlogPost", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  });

  app.get("/auth/github",
  passport.authenticate("github", { scope: [ 'user:email' ] })
  );

app.get("/auth/github/BlogPost", 
  passport.authenticate("github", { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  });

app.get("/about",function(req,res){
  
  let name = "user";
  let link="#";

  if(req.isAuthenticated())
  {
    name = req.user.username;
    link = req.user._id;
  }
  
  res.render("about",{para_content: aboutContent, name: name,p_link: link});
});

app.get("/contact",function(req,res){
  
  let name = "user";
  let link="#";

  if(req.isAuthenticated())
  {
    name = req.user.username;
    link = req.user._id;
  }
  
  res.render("contact",{para_content: contactContent , name: name,p_link: link});
});

app.get("/compose",function(req,res){
  let name = "user";
  let link="#";

  if(req.isAuthenticated())
  {
    name = req.user.username;
    link = req.user._id;
  }
  
  if(req.isAuthenticated())
  res.render("compose",{name: name,p_link: link});
  else
  res.redirect("/login");
});

app.post("/compose",function(req,res){
  const time = new Date();
  const new_post = new Post ({ 
    title : req.body.post_title,
    blog : req.body.post_body,
    author: req.user.username,
    author_id: req.user._id,
    date: time
  });

  new_post.save(function(err){
     if(!err)
     res.redirect("/");
  });
  
});

app.get("/post/:id",function(req,res){
  
  let name = "user";
  let link="#";
  
  if(req.isAuthenticated())
  {
    name = req.user.username;
    link = req.user._id;
  }
  
  let id = req.params.id;
  Post.findOne({_id: id},function(err,post){
    if(err)
    console.log(err);
    else
    {
      if(post)
      res.render("post",{ptitle: post.title,pblog: post.blog,pauth: post.author, name: name,p_link: link});
      else
      res.send("Please send a valid id of post");
    }
      
  });
});

app.get("/profile/:id",function(req,res){
  let prof_id = req.params.id;
  let name = "user";
  let link="#";
  let prof_name="";
  if(req.isAuthenticated())
  {
    name = req.user.username;
    link = req.user._id;
  }
  
  User.findOne({_id: prof_id},function(err,profile){
      if(err)
      {
        console.log(err);
      }
      else
      {
        if(profile)
        {
          prof_name = profile.username;
        }
        else
        res.send("Please enter a valid user id");
      }
      
  });

  Post.find({author_id: prof_id},function(err,blogs){
    res.render("profile",{profile: prof_name , posts: blogs,name: name,p_link: link});
  });
});


app.get("/register",function(req,res){
  
  let name = "user";
  let link="#";

  if(req.isAuthenticated())
  {
    name = req.user.username;
    link = req.user._id;
  }
  
  res.render("register",{name: name,p_link: link});
});

app.post("/register",function(req,res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err)
    {
      console.log(err);
      res.redirect("/register");
    }
    else
    {
      passport.authenticate("local")(req,res, function(){
        res.redirect("/compose");
      });
    }
  });

});

app.get("/login",function(req,res){
  
  let name = "user";
  let link="#";

  if(req.isAuthenticated())
  {
    name = req.user.username;
    link = req.user._id;
  }
  
  res.render("login",{name: name,p_link: link});
});

app.post("/login",function(req,res){

  const user = new User({
     username: req.body.username,
     password: req.body.password
  });

  req.login(user, function(err){
    if(err)
    {
      console.log(err);
      res.redirect("/login");
    }
    else
    {
      passport.authenticate("local")(req,res, function(){
        res.redirect("/compose");
      });
    }
  })


  // const email = req.body.email;
  // const pass = req.body.password;

  // User.findOne({email: req.body.email}, function(err,foundUser){
  //   if(err)
  //   console.log(err);
  //   else
  //   {
  //     if(foundUser)
  //     {
  //       console.log(foundUser);
  //       bcrypt.compare(pass, foundUser.password, function(err, result) {
  //         if(err)
  //         console.log(err);

  //         if(result === true)
  //         res.redirect("compose");
  //         else 
  //         res.redirect("login");
  //     });
  //     }
  //     else
  //     res.redirect("login");
  //   }
  // });
});

app.get("/logout",function(req,res){

  req.logout();
  res.redirect("/");

});

const port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log("Server started on port " +port);
});

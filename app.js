//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const homeStartingContent = "The following web page has been uploaded using the heroku services. It is a simple blog website where one can freely scroll through the blogs others have written on it. If you want to write your own blogs then you can register on the website, DON'T WORRY, your email id and password won't be shared, even the developers of this page can't see your password. After registering, you would be taken to the blog page where you can decide whether you want to write your own blog. Anything you want to write, you can write it anonymously. This websites uses cookies so you would be logged in the website until you close your search engine. The logout button is at the bottom right corner of the page. Feel free to express yourself.";
const aboutContent = "This website has been made using HTML, CSS, BOOTSTRAP, Javascript along with dependencies including express, body-parser, ejs, lodash, dotenv, mongoose, express-session, passportJS, passport-local, passport-local-mongoose, passport-google-oauth20, mongoose-findorcreate. The passportjs is used to save cookies and to hash and salt the user passwords. Google-oauth is used so that the users can simply login to the website with their gmail ids. Git repository link is : https://github.com/Karan9bhat/Blog.git . Your feedback will be well appreciated.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

app.use(session({
  secret: "The first secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-Karan:Test123@cluster0-mzhe1.mongodb.net/diaryDB", {useNewUrlParser: true});
mongoose.set("useCreateIndex", true);

const postSchema = {
  title: String,
  content: String
};

const Post = mongoose.model("Post", postSchema);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

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
    callbackURL: "http://localhost:3000/auth/google/diary",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
    res.render("home");
});

app.get("/auth/google", 
    passport.authenticate("google", {scope: ["profile"]})
);

app.get("/auth/google/diary", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect("/blog");
});

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/blog", function(req, res) {
  User.find({"secret": {$ne: null}}, function(err, foundUsers) {
    if(err) {
      console.log(err);
    } else {
      if(foundUsers) {
        Post.find({}, function(err, posts) {
          if(err) {
            console.log(err);
          } else {
            res.render("blog", {
              startingContent: homeStartingContent,
              posts: posts
            });
          }
        });
      }
    }
  });
});
  // User.find({"secret": {$ne: null}}, function(err, foundUsers) {
  //   if(err) {
  //     console.log(err);
  //   } else {
  //     if(foundUsers) {
  //       res.render("secrets", {usersWithSecrets: foundUsers});
  //     }
  //   }
  // });


app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/about", function(req, res) {
  res.render("about", {about: aboutContent});
});

app.get("/contact", function(req, res) {
  res.render("contact", {contact: contactContent});
});

app.get("/compose", function(req, res) {
  Post.find({}, function(err, posts) {
    res.render("compose", {
      startingContent: homeStartingContent,
      posts: posts
    });
  });
});

app.post("/compose", function(req, res) {
  const post = new Post ({
    title: req.body.postTitle,
    content: req.body.postBody
  });

  if(req.isAuthenticated()) {
    post.save(function(err) {
      if(!err) {
        res.redirect("/blog");
      }
    });
  } else {
    res.redirect("register");
  }
  
  // const submittedSecret = req.body.secret;

  //   //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // // console.log(req.user.id);

  //   User.findById(req.user.id, function(err, foundUser) {
  //       if(err) {
  //           console.log(err);
  //       } else {
  //               if(foundUser) {
  //               foundUser.secret = submittedSecret;
  //               foundUser.save(function() {
  //                   res.redirect("/blog");
  //               });
  //           }
  //       }
  //   });
});

// app.get("/posts/:postId", function(req, res) {
//   const requestedPostId = _.lowerCase(req.params.postId);
  
//   Post.findOne({_id: requestedPostId}, function(err, post) {
//     res.render("post", {
//       title: post.title,
//       content: post.content
//     });
//   });
// });

app.get("/blog", function(req, res) {
  res.render("blog");
});

app.post("/blog", function(req, res) {
  res.render("blog");
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res) {
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
      res.redirect("/blog");
    } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/blog");
      });
    }
  });
});

app.post("/login", function(req, res) {
    
  const user = new User({
      username: req.body.username,
      password: req.body.password
  });
  
  req.login(user, function(err) {
      if(err) {
          console.log(err);
      } else {
          passport.authenticate("local")(req, res, function() {
              res.redirect("/blog");
          });
      }
  });

});

let port = process.env.PORT;
if(port == null || port == "") {
	port = 3000;
}

app.listen(port, function() {
  console.log("Server has started on port 3000");
});

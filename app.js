require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const FacebookStrategy = require('passport-facebook').Strategy;
/********************************* */
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;


const findOrCreate = require("mongoose-findorcreate");
/****************************** */
const app = express();



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect('mongodb+srv://admin-berke:test123@cluster0.0trtd.mongodb.net/userDB');


const profileSchema = new mongoose.Schema({
    name: String,
    surname: String,
    email: String,
    phoneNumber: String,
    information: String,
});
const Profile = mongoose.model("Profile", profileSchema);

const commentSchema = new mongoose.Schema({
    author: String,
    comment: String,
    rating: Number,
});
const Comment = mongoose.model("Comment", commentSchema);

const postSchema = new mongoose.Schema({
    title: { required: true, type: String },
    content: { type: String },
    comments: [
        commentSchema
    ]
});
const Post = mongoose.model("post", postSchema);

const infoSchema = new mongoose.Schema({
    name: String,
    number: String,
    mail: String,
    github: String
})

const Info = mongoose.model("Info", infoSchema);

const info1 = new Info({
    name: "Berke Gürel",
    number: "05369884368",
    mail: "aktansanhal@gmail.com",
    github: "berke"
});

const info2 = new Info({
    name: "İbrahim Aktan Sanhal",
    number: "05369884368",
    mail: "aktansanhal@gmail.com",
    github: "aktanSN"
});

const info3 = new Info({
    name: "Selim Dinler",
    number: "05369884368",
    mail: "mailler@gmail.com",
    github: "selim"
});

const info4 = new Info({
    name: "Muhammed Ali Ozden",
    number: "05369884368",
    mail: "mailler@gmail.com",
    github: "mali"
});

const defaultInfos = [info1, info2, info3, info4];


app.get("/iletisim", function (req, res) {
    Info.find({}, function (err, foundInfos) {

        if (foundInfos.length === 0) {
            Info.insertMany(defaultInfos, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("saved");
                }
            });
            res.redirect("/iletisim");
        } else {
            res.render("iletisim", { title: "İletişim Bilgileri", infos: foundInfos });
        }



    })

});

const aboutUsSchema = new mongoose.Schema({
    title: String,
    content: String
})

const AboutUs = mongoose.model("AboutUs", aboutUsSchema);

const aboutUs = new AboutUs({
    title: "Hakkımızda",
    content: "Web teknolojileri ve programlama dersinde proje ortaya koymak amacıyla bir araya gelmiş bir ekibiz. Alvalizi adında "
        + "insanların seyahat ettikleri yerleri birbirleriyle paylaşabilmeleri için hazırladığımız web projesini sizlere sunuyoruz. "
});

const defaultAboutUs = [aboutUs];

app.get("/aboutUs", function (req, res) {
    AboutUs.find({}, function (err, foundInfos) {

        if (foundInfos.length === 0) {
            AboutUs.insertMany(defaultAboutUs, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("saved");
                }
            });
            res.redirect("/aboutUs");
        } else {
            res.render("aboutUs", { infos: foundInfos });
        }



    })

});

app.get("/destek", function (req, res) {
    res.render("destek");

});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    userInfo: profileSchema,
    myPosts: [
        postSchema
    ],
    myComments: [
        commentSchema
    ]
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
/***************FACEBOOK*********************** */
passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified'],
},
    function (accessToken, refreshToken, profile, cb) {

        User.findOrCreate({ facebookId: profile.id, username: profile._json.email }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/posts');
    });

/***************GOOGLE******************** */
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        //console.log(profile);

        User.findOrCreate({ googleId: profile.id, username: profile._json.email }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/posts');
    });
/********************************************** */


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", { failureRedirect: "/login" }), function (req, res) {
    res.redirect("/posts");
});

app.get("/logout", function (req, res) {
    req.logOut();
    res.redirect("/")
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/posts", function (req, res) {
    if (req.isAuthenticated()) {
        Post.find({}, function (err, docs) {
            if (err) {
                console.log(err);
            } else {
                Comment.find({}, function (err, comDoc) {
                    if (!err) {
                        res.render("posts", {
                            posts: docs,
                            comments: comDoc
                        });
                    }
                })
            }
        });
    } else {

        res.redirect("/login");
    }
});

app.get("/covid", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("covid");
    } else {
        res.redirect("/login");
    }
});

app.get("/postShare", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("postShare");
    } else {
        res.redirect("/login");
    }
});

app.get("/profileCompleted", function (req, res) {
    if (req.isAuthenticated()) {
        if (req.user.userInfo) {
            const profileObject = {
                name: req.user.userInfo.name,
                surname: req.user.userInfo.surname,
                email: req.user.userInfo.email,
                phoneNumber: req.user.userInfo.phoneNumber,
                information: req.user.userInfo.information
            }

            res.render("profileCompleted", {
                profile: profileObject
            });
        } else {
            res.redirect("/profile");
        }
    } else {
        res.redirect("/login")
    }
})

app.get("/profile", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("profile")
    } else {
        res.redirect("/login");
    }
})

app.get("/translate", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("translate");
    } else {
        res.redirect("/login");
    }
});

app.get("/passwordChange", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("passwordChange");
    } else {
        res.redirect("/login");
    }
});

app.post("/passwordChange", function (req, res) {
    User.findOne({ username: req.body.username }, function (err, doc) {
        if (doc) {
            doc.changePassword(req.body.oldPassword, req.body.newpassword, function (err) {
                if (err) {
                    console.log(err);
                    res.redirect("/passwordChange");
                } else {
                    res.redirect("/posts");
                }
            })
        }
    })
});

app.get("/myShares", function (req, res) {
    User.findOne({ username: req.user.username }, function (err, doc) {
        if (!err) {
            res.render("myShares", { comments: doc.myComments, posts: doc.myPosts });
        }
        else {
            console.log(err);
        }
    });
});

app.get("/update", function (req, res) {
    User.findOne({ username: req.user.username }, function (err, doc) {
        if (!err) {
            res.render("update", { comments: doc.myComments, posts: doc.myPosts });
        }
        else {
            console.log(err);
        }
    });
});

app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/posts")
            })
        }
    })
});

app.post("/profile", function (req, res) {

    if (req.isAuthenticated()) {
        const profile = new Profile({
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            information: req.body.information
        });
        profile.save();
        User.findOneAndUpdate({ username: req.body.email }, { userInfo: profile }, { new: true }, function (err, doc) {
            const profileObject = {
                name: doc.userInfo.name,
                surname: doc.userInfo.surname,
                email: doc.userInfo.email,
                phoneNumber: doc.userInfo.phoneNumber,
                information: doc.userInfo.information
            };
            res.render("profileCompleted", {
                profile: profileObject
            });
        });
    } else {
        res.redirect("/login");
    }
})

/* POST PAYLAŞMA */
app.post("/postShare", function (req, res) {
    const post = new Post({
        title: req.body.postTitle,
        content: req.body.postBody,
    });
    post.save();
    User.findOneAndUpdate({ username: req.user.username }, { $push: { myPosts: post } }, function (err) {
        if (!err) {
            res.redirect("/posts");
        } else {
            console.log(err);
        }
    });
});

/* YORUM YAPMA */
app.post("/posts", (req, res) => {
    const comment = new Comment({
        author: req.user.username,
        comment: req.body.comment,
        rating: req.body.rating
    });
    comment.save();
    User.findOneAndUpdate({ username: req.user.username }, { $push: { myComments: comment } }, function (err) {
        if (!err) {
            Post.findOneAndUpdate({}, { $push: { myComments: comment } }, function (err) {
                if (!err) {
                    res.redirect("/posts");
                }
            })
        } else {
            console.log(err);
        }
    });
});

/* YORUM SILME */
app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    User.findOneAndUpdate({ username: req.user.username }, { $pull: { myComments: { _id: checkedItemId } } }, function (err) {
        if (!err) {
        }
    });
    Comment.findByIdAndRemove(checkedItemId, function (err) {
        if (!err) {
            res.redirect("/myShares");
        }
    })
});

/* POST SILME */
app.post("/deletePost", function (req, res) {
    const checkedItemId = req.body.Postcheckbox;

    User.findOneAndUpdate({ username: req.user.username }, { $pull: { myPosts: { _id: checkedItemId } } }, function (err) {
        console.log("Userdaki post silindi");
    });

    Post.findByIdAndRemove(checkedItemId, function (err) {
        if (!err) {
            res.redirect("/myShares");
        }
    })
})

/* YORUM EDIT */
app.post("/updateComments", function (req, res) {
    const commentId = req.body.checkbox;
    const newComment = req.body.comment;

    Comment.findByIdAndUpdate({ _id: commentId }, { $set: { comment: newComment } }, function (err, doc) {
        if (!err) {
            User.updateOne({ 'myComments._id': commentId }, { '$set': { 'myComments.$.comment': newComment } }, function (err) {
                console.log(err);
                res.redirect("/update")
            })
        }
    })
})

/* POST EDIT */
app.post("/updatePost", function (req, res) {
    const contentId = req.body.checkbox;
    const newContent = req.body.contentText;

    Post.findByIdAndUpdate({ _id: contentId }, { $set: { content: newContent } }, function (err, doc) {
        if (!err) {
            User.updateOne({ "myPosts._id": contentId }, { $set: { "myPosts.$.content": newContent } }, function (err) {
                console.log(err)
                res.redirect("/update")
            })
        }
    })
})

app.get("/deleteAcc", function (req, res) {
    res.render("deleteAcc");
});

app.post("/deleteAcc", function (req, res) {
    User.findOneAndRemove({ username: req.user.username }, function (err) {
        if (!err) {
            console.log("Deleted Successfully");
            res.redirect("/");
        }
    })
});


let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server has started Successfully");
});


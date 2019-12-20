var express = require('express');
var myParser = require("body-parser");
var session = require('express-session');
var mongoose = require('mongoose');
var md5 = require('md5');
const multer = require('multer');
var toxicity = require('@tensorflow-models/toxicity');
var upload = require('express-fileupload');

const threshold = 0.9;

// setting storage
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + ".jpg")
    }
})


var app = express();
app.use(express.static('public'));
mongoose.connect('mongodb://127.0.0.1/assignment1');
app.use(upload());
var userModel = mongoose.model('users', mongoose.Schema({ username: String, password: String, user_role: Number }));


app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(myParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', './views');

//// index page

app.get('/', function (req, res) {
    console.log('login page accessed');


    if (req.session.user && req.session.pass && req.session.user_role) {
        res.redirect('/home');
    } else {
        res.render('login');
    }
});

app.post('/auth', function (req, res) {
    console.log('auth start');
    var username = req.body.user;
    var password = md5(req.body.pass);
    var r = res;
    if (username && password) {
        userModel.find({ username: username, password: password }, function (err, reposnse) {
            if (err) throw err;
            if (reposnse.length == 1) {
                //// creating session
                req.session.user = reposnse[0].username;
                req.session.pass = reposnse[0].password;
                req.session.user_role = reposnse[0].user_role;
                r.redirect('/home');
            } else {
                res.send("<script>alert('Invalid login or password!'); window.location.replace('/')</script>");
            }
        });
    }
});

app.post('/signup', function (req, res) {
    console.log('signup start');
    var username = req.body.user;
    var password = md5(req.body.pass);
    var newUser = new userModel({ username: username, password: password, user_role: 1 })
    newUser.save(function (err, resullt) {
        if (err) { throw err }
        else {
            res.send("<script>alert('Account Created!'); window.location.replace('/')</script>")
        }
    })

});


app.get('/home', function (req, res) {
    console.log('home  page accessed');
    var username = req.session.user;
    var password = req.session.pass;
    var user_role = req.session.user_role;
    if (!username || !password || !user_role) {
        res.redirect('/');
        res.end();

    }

    console.log('uploading form accessed');
    //res.render('main');
    res.render('UploadForm.pug');

});


app.post('/file_upload',function(req,res){
    console.log('files recieved');
    if(req.files){
        console.log('inside');
        var file = req.files.file,
        filename = "uploaded.jpg";
        console.log('just moving the files');
        file.mv("./public/"+filename,function(err){
            if(err){
                console.log(err)
                res.send('error occurred')
            }
            else {
                console.log('yus done')
                res.render('main');
            }
        })
    }
});

app.get('/logout', function (req, res) {
    console.log('logout  page accessed');
    delete req.session.user;
    delete req.session.pass;
    delete req.session.user_role;
    res.redirect('/');

});


app.use(function (req, res, next) {
    res.status(404).render('404', { title: "Sorry, page not found" });
});



app.listen(1338, '127.0.0.1');
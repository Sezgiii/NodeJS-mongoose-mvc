const express    = require('express');
const app        = express();

const bodyParser = require('body-parser'); 
const path       = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);
const csurf = require('csurf');
const multer = require('multer'); 

const adminRoutes = require('./routes/admin'); 
const userRoutes  = require('./routes/shop');
const accountRoutes = require('./routes/account');

const errorController = require('./recontrollers/errors');

const User = require('./models/user'); 
const { findByUserName } = require('./models/user');
const ConnectionString = 'mongodb+srv://sezgi:u3JvQxkwzH6AiSS8@cluster0.zzp0xij.mongodb.net/node-app?retryWrites=true&w=majority';

var store = new mongoDbStore({
    uri: ConnectionString,
    collection : 'mySessions'
})

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, './views/resim');  
    },
    filename: function(req,file,cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

app.set('view engine', 'pug');
app.set('views','./views'); 

app.use(bodyParser.urlencoded({ extended : false})); 
app.use(multer({ storage: storage }).single('image'));
app.use(cookieParser()); 
app.use(session({           
    secret: 'keyboard cat',
    resave : false,
    saveUninitialized: false, 
    cookie:{
        maxAge: 3600000  
    },
    store: store 
}));
app.use(express.static(__dirname +'/views')); 

app.use((req,res,next) => {
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
        .then(user =>{
            req.user = user;
            next();
        })
        .catch(err => {console.log(err)});
})

app.use(csurf());
                                                                
app.use('/admin',adminRoutes);
app.use(userRoutes);
app.use(accountRoutes); 

app.use('/500', errorController.get500Page);
app.use(errorController.get404Page);
app.use((error,req,res,next)=> {
    res.status(500).render('error/500', {title: 'Error'});
});

mongoose.connect(ConnectionString)
    .then(() => {
        console.log('connected to mongodb');
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    })

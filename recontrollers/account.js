const User = require('../models/user');
const Login = require('../models/login');
const sgMail = require('@sendgrid/mail');
const bcrypt = require('bcrypt');  
const crypto = require('crypto');
const login = require('../models/login');

sgMail.setApiKey('SG.Ezskljf54545s.5sfsfdgtk-2R2-o1WdlkhşhkJsb4khjlWmxsfRyk9yghL');

exports.getLogin = (req,res,next) => {

    var errorMessage = req.session.errorMessage;  
    delete req.session.errorMessage;  

    res.render('account/login', {
        path:'/login',
        title: 'Login',
        errorMessage:errorMessage
    });
}

exports.postLogin = (req,res,next) => { 

    const email = req.body.email;
    const password = req.body.password;

    const loginModel = new Login({
        email:email,
        password:password 
    });
        loginModel
            .validate()
            .then(()=>{
                User.findOne({email : email })
                .then(user => {
                    if(!user){ 
                        req.session.errorMessage = 'Bu mail adresi ile bir kayıt bulunamamıştır.'; 
                        req.session.save(function (err) {
                            res.redirect('/login')
                        })
                        
                    }  
                    bcrypt.compare(password,user.password)  
                        .then(isSuccess => {
                            if(isSuccess){   
                                req.session.user = user;
                                req.session.isAuthenticated = true;
                                return req.session.save(function (){
                                    var url = req.session.redirectTo || '/home'; 
                                    delete req.session.redirectTo; 
                                    return res.redirect(url);
                                })
                            }
                            req.session.errorMessage = 'Hatalı e-posta yada parola girdiniz.'; 
                            req.session.save(function (err) {
                                res.redirect('/login')
                            })  
                        })
                        .catch(err => {
                            console.log(err);
                        })     
                })
                .catch(err => {
                    console.log(err);
                })
            })
            .catch(err=> {
                if (err.name == 'ValidationError'){
                    let message ='';
                    for (field in err.errors){
                        message +=err.errors[field].message + '<br>';
                    }
                    res.render('account/login', {
                        path:'/login',
                        title: 'Login',
                        errorMessage:message
                    });
                } else {
                    next(err);
                }
            })
}

exports.getRegister = (req,res,next) => {

    var errorMessage = req.session.errorMessage;  
    delete req.session.errorMessage;  
    res.render('account/register', {
        path:'/register',
        title: 'Register',
        errorMessage:errorMessage
    });
}

exports.postRegister = (req,res,next) => {  

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    User.findOne({email : email}) 
        .then((user) => {   
            if(user){
                req.session.errorMessage = 'Bu mail adresi ile daha önce bir kayıt oluşturuldu.'; 
                req.session.save(function (err) {
                    console.log(err);
                    return res.redirect('/register')
                })
                 
            } 
            return bcrypt.hash(password, 10);  
        })
        .then(hashedPassword => {
            const newUser = new User({  
                name:name,
                email:email,
                password:hashedPassword,
                cart: {items:[]}  
            });
            return newUser.save();  
        })
        .then(() => {
            res.redirect('/login')  

            const msg ={
                to: email,
                from: 'info@turan.com',
                subject: 'Hesap oluşturuldu.',
                html:'<h1>Hesabınız başarılı bir şekilde oluşturulmuştur.</h1>'
            };
            sgMail.send(msg);
        })
        .catch((err) => {
            if (err.name == 'ValidationError'){
                let message ='';
                for (field in err.errors){
                    message +=err.errors[field].message + '<br>';
                }
                res.render('account/register', {
                    path:'/register',
                    title: 'Register',
                    errorMessage:message
                });
            }else {
                next(err);
            }
        })
}

exports.getReset = (req,res,next) => {

    var errorMessage = req.session.errorMessage;  
    delete req.session.errorMessage;  

    res.render('account/reset', {
        path:'/reset-password',
        title: 'Reset Password',
        errorMessage: errorMessage 
    });
}

exports.postReset = (req,res,next) => {

    const email = req.body.email;

    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            return res.redirect('/reset-password');
        }
        const token = buffer.toString('hex');

        User.findOne({email:email})
            .then(user => {
                if(!user){
                    req.session.errorMessage = 'Mail adresi bulunamadı.'
                    req.session.save(function (err) {
                        return res.redirect('/reset-password')
                    })
                }
                user.resetToken= token;  
                user.resetTokenExpiration = Date.now()+3600000; 
                return user.save();
            })
            .then (result => {
                res.redirect('/home');

                const msg ={
                    to: email,
                    from: 'info@turan.com',
                    subject: 'Parola Reset',
                    html:`
                        <p>Parolanızı güncellemek için aşağıdaki linke tıklayınız.</p>
                        <p>
                            <a href="http://localhost:3000/reset-password${token}"> Reset password </a>
                        </p>
                    `
                };
                sgMail.send(msg);  
            })
            .catch(err => {
                next(err);
            })
    })
}

exports.getNewPassword = (req,res,next) => {
   
    var errorMessage = req.session.errorMessage;  
    delete req.session.errorMessage;  

    const token= req.params.token;

    User.findOne({
        resetToken: token, 
        resetTokenExpiration: {
            $gt: Date.now()  
        }
    })
    .then(user => {
        res.render('account/new-password', {
            path:'/new-password',
            title: 'New Password',
            errorMessage: errorMessage,
            userId:user._id.toString(),
            passwordToken: token 
        });
    })
    .catch(err => {
        next(err);
    })
}


exports.postNewPassword = (req,res,next) => {
   const newPassword = req.body.password;
   const userId = req.body.userId;
   const token = req.body.passwordToken;
   let _user;

   User.findOne({  
    resetToken: token, 
    resetTokenExpiration: {  
        $gt: Date.now() 
    },
    _id: userId 
})
.then(user => {
    _user=user;
    return bcrypt.hash(newPassword,10);
}).then(hashedPassword => {
    _user.password = hashedPassword;
    _user.resetToken = undefined;
    _user.resetTokenExpiration = undefined;
    return _user.save();
}).then(()=> {
    res.redirect('/login');
}).catch(err=>{
    next(err);
})

}


exports.getLogout = (req,res,next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/home');
    })
}


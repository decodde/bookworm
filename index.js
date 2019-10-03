var express=require("express")
var app=express()
var fs=require("fs")
var path=require("path")
var db=require("./lib/dbprocess")
var session=require('express-session')
var mongoose=require("mongoose")

var mongoose = require('mongoose'),
 Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/bookworm');
mongoose.connection.on('open', function() {
console.log('Mongoose connected.');
});

var BookwormUsers = require('./lib/models').BookwormUsers,Apps=require('./lib/models').Apps,Books=require('./lib/models').Books;

app.use(require('body-parser')());
app.use(express.static(__dirname+"/public"))
app.set('views',__dirname+"/views")
app.set('view engine',  'pug');
app.use(session({
    secret: 'bkworm',
    resave: true,
    maxAge:600000,
    saveUninitialized: false
  }));
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    next();
  });
app.get("/",function(req,res){
    var extdt={
        role:req.session.role,
        username:req.session.username
    }
    
    res.render("home",{exdt:extdt})
})


app.get("/register",(req,res)=>{
    res.render("register")
})
app.post("/register",(req,res)=>{
    var{username,emailAddress,mobileNumber}=req.body
    BookwormUsers.find({username:username,emailAddress:emailAddress,mobileNumber:mobileNumber},(err,data)=>{
        console.log(data)
        if(data.length==0){
                req.body.verified=false;
                req.body.verificationLink=db.generateBoken(req.body.firstName,req.body.lastname)
                BookwormUsers.insertMany(req.body,(err,data)=>{
                    if(err) console.log(err)
                    db.sendEmail("register",req.body)
                    res.json({type:"success",message:"Created Account Successfully"})
                })
        }
        else if(data.length>0){
                res.json(db.processRegisterError(req.body,data))
        }
        
    })
   
})

app.get("/dashboard",(req,res)=>{
    req.session.username?res.render("dashboard",{username:req.session.username,apps:db.getUserApps(req.session.username)}): res.render("dashboard")
})
app.get("/login",function(req,res){
    res.render("login")
})

app.post("/login",(req,res)=>{
    console.log("here")
    BookwormUsers.find({username:`${req.body.username}`},(err,data)=>{
        if(data.length==0){
            res.json({type:"error",message:"Login details are incorrect"})
        }
        if(data.length>0){
            if(data.password==req.body.password){
                req.session.username=req.body.username
                req.session.granted=true
                res.json({type:"success",value:true})
            }
            else res.json({type:"error",message:"Login details are incorrect"})
        }
    })
    
})
app.post("/createApp/:appname",(req,res)=>{

    var a=db.addApp({appName:req.params.appname,username:req.session.username})
    if(typeof a=="object")res.json(a)
    else res.json({type:"error",message:"Appname already in use"})
})

//@TODO ---> 
/** */
app.get("/appdashboard:app",(req,res)=>{
    var app=req.params.app.split(":")
    var [appName,bokenID]=app
    //console.log(appName,bokenID)
    if(req.session.granted){
        if(db.checkAppExists(appName)){
            //console.log(db.checkOwner(appName))
            if(req.session.username==db.checkOwner(appName).owner){
                if(db.checkBokenPart(appName,bokenID)){
                    res.render("dash",db.getApp(appName))
                }
            }
            else res.render("dash",{type:"error",message:"You have no access to the app"})
        }
        else res.render("dash",{type:"error",message:"App does not exist"})
      
    }
    else res.render("dash",{type:"error",message:"You are unauthorized to access this page"})
})
/**/
app.get("/test:the",(req,res)=>{
    console.log(req.params.the)
    res.json(db.getApp("trapdoor"))
})

app.get("/getBooks/:appName/:bokenID",(req,res)=>{
    var {appName,bokenID}=req.params
    
    if(db.checkAppExists(appName)){
        //console.log(db.checkOwner(appName))
        if(db.checkBoken(appName,bokenID)){
            res.json(db.getBooks(appName,bokenID))
        }
        else res.json({type:"error",message:"You have no access to the app with specified boken"})
        
    }
    else res.json({type:"error",message:"App does not exist"})
})
app.post("/addBook/:appName/:bokenId",(req,res)=>{
    console.log("reqparams: ",req.params)
    var {appName,bokenId}=req.params
    var book=req.body
    console.log("appname: ",appName)
    console.log("book: ",book)
    if(db.checkAppExists(appName)){
        if(db.authenticateBoken(appName,bokenId)){
            res.json(db.addBookTo(appName,bokenId,book))
        }
        else res.json({type:"error",message:"Invalid Boken"})
    }
    else res.json({type:"error",message:"The App does not exist"})
})
app.post("/updateBook/:appName/:bokenId/:bookId",(req,res)=>{
    var {appName,bokenId,bookId}=req.params
    var bookDetails=req.body
    
    if(db.checkAppExists(appName)){
        if(db.authenticateBoken(appName,bokenId)){
            if(db.bookExists(appName,bokenId,bookId)){
                res.json(db.updateBook(appName,bokenId,bookId,bookDetails))
            }
            else res.json({type:"error",message:"Book does not exist"}) 
        }
        else res.json({type:"error",message:"Invalid Boken"})
    }
    else res.json({type:"error",message:"The App does not exist"})

})
app.get("/deleteBook/:appName/:bokenId/:bookId",(req,res)=>{
    
    var {appName,bokenId,bookId}=req.params
    if(db.checkAppExists(appName)){
        if(db.authenticateBoken(appName,bokenId)){
            if(db.bookExists(appName,bokenId,bookId)){
                res.json(db.deleteBook(appName,bokenId,bookId))
            }
            else res.json({type:"error",message:"Book does not exist"}) 
        }
        else res.json({type:"error",message:"Invalid Boken"})
    }
    else res.json({type:"error",message:"The App does not exist"})
})
app.get("/findBook/:appName/:bokenId/:bookId",(req,res)=>{
    var {appName,bokenId,bookId}=req.params
    if(db.checkAppExists(appName)){
        if(db.authenticateBoken(appName,bokenId)){
            if(db.bookExists(appName,bokenId,bookId)){
                res.json(db.findBook(appName,bokenId,bookId))
            }
            else res.json({type:"error",message:"Book does not exist"}) 
        }
        else res.json({type:"error",message:"Invalid Boken"})
    }
    else res.json({type:"error",message:"The App does not exist"})
})
/*>>>>>>>>>>>>>>>>>>> API <<<<<<<<<<<<<<<<<<<<<<
>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<*/
app.get("/verify",(req,res)=>{
    req.session.granted?res.redirect("/dashboard"):res.render("verifyResult",{type:"null"})
})
app.get("/verify/:name/:verifyLink",(req,res)=>{
    var {name,verifyLink}=req.params
    var a=db.verify(req.params.name,req.params.verifyLink)
    BookwormUsers.find({username:`${name}`,verificationLink:`${verifyLink}`},(err,data)=>{
        if(data.length==0){
            res.json({type:"error",message:"User does not exist"})
        }
        else if(data.length>0){
            console.log(data[0])
            if(data[0].username==name&&data[0].verificationLink==verifyLink&&data[0].verified==false){
                BookwormUsers.updateOne({username:`${name}`,verificationLink:`${verifyLink}`},{$set:{verified:true}})
                res.json({type:"success",message:"Verification Successful"})
            }
            else if(data[0].verificationLink!=verifyLink)res.json({type:"error",message:"Verification Link is not valid"})
            else if (data[0].verified==false)res.json({type:"error",message:"User already verified"})
        }
    })
    req.session.granted?res.redirect("/dashboard"):res.render("verifyResult",a)
})
app.get("/logout",(req,res)=>{
    if(req.session&&req.session.granted){
            req.session.destroy()
            res.redirect("/")
    }
    else res.json({type:"error",data:"false",message:"Unable to Logout"})
})

app.get("/getusers",(req,res)=>{
    var dtusers=db.getusers()
    req.session&&req.session.granted&&req.session.role=="admin"?res.json(dtusers):res.send("You are not authorized")
})

app.post("/adduser",(req,res)=>{
    if(req.session&&req.session.granted&&req.session.role=="admin"){
        var d=db.adduser(req.body.username,req.body.password,req.body.role)
        res.send(d)
    }
    else res.send("Not Authorized")
})

app.post("/updateprofile/:user/:password/:role",(req,res)=>{
    var d=db.updateprofile(req.params.user,req.params.password,req.params.role)
    d?res.send("Updated Profile Successfully"):res.send("Error updating Profile")
})

app.get("/admin-dashboard",(req,res)=>{
    var settings=db.settings()
    var extdt={
        role:req.session.role,
        username:req.session.username
    }
    req.session&&req.session.granted? res.render("admin",{exdt:extdt,settings:settings}):res.render("401")
})
/*dev*
app.listen(3000,(err)=>{
    console.log("_____________\n\\       __   \\\n \\     |__|   \\  \n  \\        ___/\n   \\    ____   \\\n    \\   \\___\\   \\\n     \\___________\\ookworm-js  \n    ##  server running  ##")
})
/** */

/*prod*/
app.listen(process.env.PORT||6700,(err)=>{
    console.log(err)
    console.log("_____________\n\\       __   \\\n \\     |__|   \\  \n  \\        ___/\n   \\    ____   \\\n    \\   \\___\\   \\\n     \\___________\\ookworm-js  \n    ##  server running  ##")
}) 
/** */

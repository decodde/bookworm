var express=require("express")
var app=express()
var fs=require("fs")
var path=require("path")
var db=require("./lib/dbprocess")
var session=require('express-session')
var mongoose=require("mongoose")

var mongoose = require('mongoose'),
 Schema = mongoose.Schema;
mongoose.connect('mongodb+srv://railosapp:mongo@railos-vkklb.mongodb.net/bookworm');
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
    if(req.session.granted){
        Apps.find({createdBy:req.session.username},(err,data)=>{
            res.render("dashboard",{username:req.session.username,apps:data})
        })
    }
    else res.render("dashboard")
})
app.get("/login",function(req,res){
    res.render("login")
})

app.post("/login",(req,res)=>{
    BookwormUsers.findOne({username:`${req.body.username}`},(err,data)=>{
        if(data==null){
            res.json({type:"error",message:"Login details are incorrect"})
        }
        else{
           
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
    if(req.session.granted){
        Apps.findOne({appName:`${req.params.appname}`},(err,data)=>{
            if (data==null){
                var boken=db.generateBoken(req.params.appname,req.session.username)
                var nApp=new Apps({appName:req.params.appname,createdBy:req.session.username,appBoken:boken})
                nApp.save()
                BookwormUsers.findOne({username:req.session.username},(err,data)=>{
                    data.bokenId=boken
                    data.appName=req.params.appname
                    db.sendEmail("newapp",data)
                    res.json({type:"success",message:"Created app succesfully",appBoken:boken})
                })
                
            }
            else res.json({type:"error",message:"Appname already in use"})
        })
    }
    else res.json({type:"error",message:"Not logged in"})
})

//@TODO ---> 
/** */
app.get("/appdashboard:app",(req,res)=>{
    var app=req.params.app.split(":")
    var [appName,bokenID]=app
    //console.log(appName,bokenID)
    if(req.session.granted){
        Apps.findOne({appName:appName},(err,data)=>{
            if (data==null)res.render("dash",{type:"error",message:"App does not exist"})
            else {
                if(data.createdBy==req.session.username){
                    var wholeBoken=data.appBoken
                    var partBoken= data.appBoken
                    partBoken=partBoken.split("|")
                    partBoken=partBoken[0]
                    if(bokenID==partBoken){
                        Books.find({appName:appName,appBoken:wholeBoken },(err,data)=>{
                            var books=data
                            var data={}
                            data.appName=appName
                            data.appBoken=wholeBoken
                            data.books=books
                            console.log(data)
                            res.render("dash",{type:"success",data:data,message:"Books Collated Successfully"})
                        })
                    }
                    else res.render("dash",{type:"error",message:"Invalid Boken"})
                }
                else res.render("dash",{type:"error",message:"You have no access to the app"})
            }
        })
    }
    else res.render("dash",{type:"error",message:"You are unauthorized to access this page"})
})

app.get("/getBooks/:appName/:bokenID",(req,res)=>{
    var {appName,bokenID}=req.params
    Apps.findOne({appName:appName},(err,data)=>{
        if (data==null)res.json({type:"error",message:"App does not exist"})
        else {
            var partBoken= data.appBoken
            if(bokenID==partBoken){
                Books.find({appName:appName,appBoken:bokenID },(err,data)=>{
                    var books=data
                    var data={}
                    data.appName=appName
                    data.appBoken=bokenID
                    data.books=books
                    console.log(data)
                    res.json({type:"success",data:data,message:"Books Collated Successfully"})
                })
            }
            else res.json({type:"error",message:"Boken and Appname Mismatch"})
        }
    })
})
app.post("/addBook/:appName/:bokenId",(req,res)=>{
    console.log("reqparams: ",req.params)
    var {appName,bokenId}=req.params
    var book=req.body
    
    Apps.findOne({appName:appName,appBoken:bokenId},(err,data)=>{
        if (data==null)res.json({type:"error",message:"App does not exist or Boken and Appname Mismatch"})
        else {
            var bookId=db.generateBookId(book.author,book.title)
            bookId=bookId.split("|")
            bookId=bookId[0]
            var dateCreated=new Date()
            book.appName=appName
            book.appBoken=bokenId
            book.createdBy=data.createdBy
            book.dateCreated=dateCreated.toUTCString()
            book.bookId=bookId
            Books.insertMany(book)
            console.log(`Added ${book.title} for ${appName}`)
            res.json({type:"success",message:"Book Added Successfully",bookId:bookId})
        }
    })
})
//var book={t:"t"}
//Books.findOneAndUpdate({appName:"trapdoor"},{$push:{books:book}})
app.post("/updateBook/:appName/:bokenId/:bookId",(req,res)=>{
    var {appName,bokenId,bookId}=req.params
    var bookDetails=req.body
    Apps.findOne({appName:appName,appBoken:bokenId},(err,data)=>{
        if (data==null)res.json({type:"error",message:"App does not exist or Boken and Appname Mismatch"})
        else {
            Books.findOne({appName:appName,appBoken:bokenId,bookId:bookId},(err,data)=>{
                if(data==null) res.json({type:"error",message:"Book does not exist"})
                else{
                    Books.findOneAndUpdate({appName:appName,appBoken:bokenId,bookId:bookId},bookDetails,{new:true},(err,data)=>{
                        console.log(`Updated ${bookId} for ${appName}`)
                    })
                    res.json({type:"success",message:"Updated Book Successfully"})
                }
            })
        }
    })

})
app.get("/deleteBook/:appName/:bokenId/:bookId",(req,res)=>{
    
    var {appName,bokenId,bookId}=req.params
    Apps.findOne({appName:appName,appBoken:bokenId},(err,data)=>{
        if (data==null)res.json({type:"error",message:"App does not exist or Boken and Appname Mismatch"})
        else {
            Books.findOne({appName:appName,appBoken:bokenId,bookId:bookId},(err,data)=>{
                if(data==null) res.json({type:"error",message:"Book does not exist"})
                else{
                    data.remove((err)=>{
                        if (err) throw err
                        else {
                            console.log("User deleted success")
                            res.json({type:"success",message:"Deleted Book Successfully"})
                        }
                    })   
                }
            })
        }
    })
})
app.get("/findBook/:appName/:bokenId/:bookId",(req,res)=>{
    var {appName,bokenId,bookId}=req.params
    Apps.findOne({appName:appName,appBoken:bokenId},(err,data)=>{
        if (data==null)res.json({type:"error",message:"App does not exist or Boken and Appname Mismatch"})
        else {
            Books.findOne({appName:appName,appBoken:bokenId,bookId:bookId},(err,data)=>{
                if(data==null) res.json({type:"error",message:"Book does not exist"})
                else{
                    res.json({type:"success",data:data,message:"Retrieved Book Successfully"})
                }
            })
        }
    })
})
/*>>>>>>>>>>>>>>>>>>> API <<<<<<<<<<<<<<<<<<<<<<
>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<*/
app.get("/verify",(req,res)=>{
    req.session.granted?res.redirect("/dashboard"):res.render("verifyResult",{type:"null"})
})
app.get("/verify/:name/:verifyLink",(req,res)=>{
    var {name,verifyLink}=req.params
    if(req.session.granted)res.redirect("/dashboard")
    else{
        BookwormUsers.find({username:`${name}`,verificationLink:`${verifyLink}`},(err,data)=>{
            if(data.length==0){
                res.json({type:"error",message:"User does not exist"})
            }
            else if(data.length>0){
                console.log(data[0])
                if(data[0].username==name&&data[0].verificationLink==verifyLink&&data[0].verified==false){
                    BookwormUsers.updateOne({username:`${name}`,verificationLink:`${verifyLink}`},{$set:{verified:true}})
                    res.render("verifyResult",{type:"success",message:"Verification successful"})
                }
                else if(data[0].verificationLink!=verifyLink)res.render("verifyResult",{type:"error",message:"Verification Link is not valid"})
                else if (data[0].verified==false)res.render("verifyResult",{type:"error",message:"User already verified"})
            }
        })
    }
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

var express=require("express")
var app=express()
var fs=require("fs")
var path=require("path")
var db=require("./lib/dbprocess")
var session=require('express-session')
app.use(require('body-parser')());
app.use(express.static(__dirname+"/views"))
app.set('views',__dirname+"/views")
app.set('view engine',  'pug');
app.use(session({
    secret: 'bkworm',
    resave: true,
    maxAge:600000,
    saveUninitialized: false
  }));


app.get("/",function(req,res){
    var extdt={
        role:req.session.role,
        username:req.session.username
    }
    var settings=db.settings()
    res.render("home",{settings:settings,exdt:extdt})
})


app.get("/register",(req,res)=>{
    res.render("register")
})
app.post("/register",(req,res)=>{
    var a=db.checkNameRules(req.body)
    console.log(typeof a)
    if(typeof a != "object"){
        res.json(db.processRegister(req.body))
    }
    else res.json(a)
})
app.get("/dashboard",(req,res)=>{
    req.session.username?res.render("dashboard",{username:req.session.username,apps:db.getUserApps(req.session.username)}): res.render("dashboard")
})
app.get("/login",function(req,res){
    res.render("login")
})

app.post("/login",(req,res)=>{
    const checkLogin=db.login("normal",req)
    if(checkLogin){
        req.session.username=req.body.username
        req.session.granted="true"
        res.json({type:"success",value:true})
    }
    
    else res.json({type:"error",message:"Invalid login details"})
})

/*>>>>>>>>>>>>>>>>>>> API <<<<<<<<<<<<<<<<<<<<<<
>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<*/
app.get("/logout/:api",(req,res)=>{
    if(req.session&&req.session.granted=="true"){
        req.params.api=="api"?()=>{
            req.session.destroy()
            res.json({type:"success",data:"false",message:"Logout Successful"})
        }:()=>{
            req.session.destroy()
            res.redirect("/")
        }
    }
    else res.json({type:"error",data:"false",message:"Unable to Logout"})
})


app.post("/savebook/:token",(req,res)=>{
    const{token,bookId}=req.params
    (req.session&&req.session.granted=="true"&&db.checkToken(token))?db.savebook(req.body.data):{type:"error",message:"You are not permitted"}
})
app.get("/getbook/:token/:bookId",(req,res)=>{
    const{token,bookId}=req.params
    db.checkToken(token)?db.getbook(token,bookId):{type:"error",message:"You are not permitted"}
})

app.get("/searchboooks/:token/",(req,res)=>{

})



app.get("/getusers",(req,res)=>{
    var dtusers=db.getusers()
    req.session&&req.session.granted=="true"&&req.session.role=="admin"?res.json(dtusers):res.send("You are not authorized")
})

app.post("/adduser",(req,res)=>{
    if(req.session&&req.session.granted=="true"&&req.session.role=="admin"){
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
    req.session&&req.session.granted=="true"? res.render("admin",{exdt:extdt,settings:settings}):res.render("401")
})
/*dev*/
app.listen(80,"127.168.10.15",(err)=>{
    console.log(err)
    console.log("_____________\n\\       __   \\\n \\     |__|   \\  \n  \\        ___/\n   \\    ____   \\\n    \\   \\___\\   \\\n     \\___________\\ookworm-js  \n    ##  server running  ##")
})
/** */

/*prod*
app.listen(process.env.PORT||6700,(err)=>{
    console.log(err)
    console.log("_____________\n\\       __   \\\n \\     |__|   \\  \n  \\        ___/\n   \\    ____   \\\n    \\   \\___\\   \\\n     \\___________\\ookworm-js  \n    ##  server running  ##")
}) 
/** */

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

app.get("/logout",(req,res)=>{
    if(req.session&&req.session.granted=="true"){
        req.session.destroy() 
        res.redirect("/")
    }
    else res.redirect("/")
})
app.get("/login",function(req,res){
    res.render("login")
})
app.get("/setup-stage:stage",(req,res)=>{
    var extdt={
        role:req.session.role,
        username:req.session.username
    }
    console.log(req.params.stage)
    if(req.params.stage=="1")res.render("setup1",extdt)
    if(req.params.stage=="2")res.render("setup2",extdt)

})
app.post("/login",function(req,res){
    fs.readFile(path.join(__dirname,"lib/users.json"),(err,data)=>{
        if(err) return console.error(err)
        data=JSON.parse(data)
        var ind=data.findIndex(o=>o.username==req.body.username)
        if(ind!=-1) {
            if(data[ind].password==req.body.password) 
            {
                req.session.role=data[ind].role
                req.session.username=req.body.username
                req.session.granted="true"
                res.send({string:"success",value:true})
            } 
            else res.send({string:"failed",value:false})
        }
        else res.send({string:"failed",value:false})
    })
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

app.listen(6700,(err)=>{
    console.log(err)
    console.log("_____________\n\\       __   \\\n \\     |__|   \\  \n  \\        ___/\n   \\    ____   \\\n    \\   \\___\\   \\\n     \\___________\\ookworm-js  \n    ##  server running  ##")
}) 
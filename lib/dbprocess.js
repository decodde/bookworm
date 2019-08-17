var fs=require("fs")
var path=require("path")

writeToFile=(filename,data)=>{
    var t= fs.writeFileSync(path.join(__dirname+filename),data)
   // console.log(t)
    return true
}
readFromFile=(filename)=>{
    var a=fs.readFileSync(path.join(__dirname+filename),{encoding:"utf-8"})
    a=JSON.parse(a)
    return a
}





/////////******************** EXPORTS ****************///////////////////////////////////////////////////////////////////////////////////////////

exports.settings=()=>{
    var a=readFromFile("/settings.json")
    return a
}
exports.updateprofile=(uname,pwd,role)=>{
    var a=readFromFile("/users.json")
    var t=a.findIndex((o)=>o.username==uname)
    a[t].username=uname
    pwd!=""?a[t].password=pwd:""
    role!=""?a[t].role=role:""
    //console.log(a)
    var rd=JSON.stringify(a)
    var w=writeToFile("/users.json",rd)
    return w
    
}
exports.getusers=()=>{
    var a=readFromFile("/users.json")    
    return a
}
exports.adduser=(username,password,role)=>{
    var a=readFromFile("/users.json")
    var usercheck=a.findIndex((o)=>o.username==username)
   // console.log(usercheck)
    if(usercheck==-1){
        a.push({"username":username,"password":password,"role":role})
            //console.log(a)
            a=JSON.stringify(a)
            var w=writeToFile("/users.json",a)
            if(w) return "User created successfully"
    }
    else return "USer ALready Exists"
}

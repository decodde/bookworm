var fs=require("fs")
var path=require("path")

writeToFile=(filename,data)=>{
    var t= fs.writeFileSync(path.join(__dirname,filename),data)
   
    return true
}
readFromFile=(filename)=>{
    var a=fs.readFileSync(path.join(__dirname,filename),{encoding:"utf-8"})
    a=JSON.parse(a)
    return a
}





/////////******************** EXPORTS ****************///////////////////////////////////////////////////////////////////////////////////////////
exports.processRegister=(reqBody)=>{
    var a=readFromFile("/bookwormUsers.json")
    let{username,lastName,emailAddress,organizationName,firstName,mobileNumber,password}=reqBody
    a.push({
        username:username,
        firstName:firstName,
        lastName:lastName,
        emailAddress:emailAddress,
        organizationName:organizationName,
        mobileNumber:mobileNumber,
        password:password,
        apps:[

        ]
    })
    a=JSON.stringify(a,null,"\t")
    var result=writeToFile("bookwormUsers.json",a)
    if(result){
        return {type:"success",message:"Registration Successful"}
    }
    else return {type:"error",message:"Registration Failed"}
}
exports.checkNameRules=(reqBody)=>{
    const{username,mobileNumber,lastName,emailAddress,organizationName}=reqBody
    var a=readFromFile("bookwormUsers.json")
    var result;
    if(a.length>0){
        a.forEach(o=>{
            o.username==username?result={type:"error",message:"Username Exists"}:result=true
            o.lastName==lastName?result={type:"error",message:"Lastname Exists"}:result
            o.emailAddress==emailAddress?result={type:"error",message:"Email Exists"}:result
            o.organizationName==organizationName?result={type:"error",message:"Organization Name Exists"}:result
            o.mobileNumber==mobileNumber?result={type:"error",message:"Mobile Number Exists"}:result
            
        })
        console.log("result:,",result)
    }
    else result=true
    return result
}

exports.login=(x,req)=>{
    if(x=="normal"){
        var a=readFromFile("bookwormUsers.json")
        var ind=a.findIndex(o=>(o.emailAddress==req.body.emailAddress||o.username==req.body.username))
        if(ind!=-1) {
            if(a[ind].password==req.body.password) return true
             
            else return false
        }
        else return false
    }
    
}
exports.settings=()=>{
    var a=readFromFile("settings.json")
    return a
}
exports.updateprofile=(uname,pwd,role)=>{
    var a=readFromFile("users.json")
    var t=a.findIndex((o)=>o.username==uname)
    a[t].username=uname
    pwd!=""?a[t].password=pwd:""
    role!=""?a[t].role=role:""
    //console.log(a)
    var rd=JSON.stringify(a)
    var w=writeToFile("users.json",rd)
    return w
    
}
exports.getUserApps=(name)=>{
    var a=readFromFile("bookwormUsers.json")
    console.log(a)
    var ind=a.findIndex(o=>o.username==name)
    console.log(ind)
    a=a[ind].apps
    return a
}
exports.getusers=()=>{
    var a=readFromFile("users.json")    
    return a
}
exports.adduser=(username,password,role)=>{
    var a=readFromFile("users.json")
    var usercheck=a.findIndex((o)=>o.username==username)
   // console.log(usercheck)
    if(usercheck==-1){
        a.push({"username":username,"password":password,"role":role})
            //console.log(a)
            a=JSON.stringify(a)
            var w=writeToFile("users.json",a)
            if(w) return "User created successfully"
    }
    else return "USer ALready Exists"
}

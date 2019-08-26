var fs=require("fs")
var path=require("path")
const Crypto = require('node-crypt');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'api.bookworm.js@gmail.com',
    pass: 'bookworm-js75'
  }
});
writeToFile=(filename,data)=>{
    var t= fs.writeFileSync(path.join(__dirname,filename),data)
   
    return true
}
readFromFile=(filename)=>{
    var a=fs.readFileSync(path.join(__dirname,filename),{encoding:"utf-8"})
    a=JSON.parse(a)
    return a
}


generateBoken=(param1,param2)=>{
    
    const crypto = new Crypto({
        key: 'b95d8cb128734ff8821ea634dc34334535afe438524a782152d11a5248e71b01',
        hmacKey: 'dcf8cd2a90b1856c74a9f914abbb5f467c38252b611b138d8eedbe2abb4434fc'
      });
      // Have some data you want to protect
      const unencryptedValue = param1+param2;
      // Encrypt it
      const encryptedValue = crypto.encrypt(unencryptedValue);
      /*
      // Decrypt it
      const decryptedValue = crypto.decrypt(encryptedValue);
      should(decryptedValue).eql(unencryptedValue);
      */
      return encryptedValue;
}
exports.checkOwner=(appname)=>{
    var apps=readFromFile("apps.json")
    var ind=apps.findIndex(o=>o.appname==appname)
    if(ind==-1) return false
    
    else return {owner:`${apps[ind].createdBy}`}
}
exports.checkBokenPart=(appname,boken)=>{
    var apps=readFromFile("apps.json")
    var ind=apps.findIndex(o=>o.appname==appname)
    
        var partBoken=apps[ind].appBoken
        partBoken=partBoken.split("|")
        partBoken=partBoken[0]
        if(boken==partBoken)return true
        else return false
    
}
exports.checkAppExists=(name)=>{
    var apps=readFromFile("apps.json")
    var ind=apps.findIndex(o=>o.appname==name)
    //console.log(ind)
    if(ind==-1) return false
    else return true
}


/////////******************** EXPORTS ****************///////////////////////////////////////////////////////////////////////////////////////////
exports.getApp=(appname)=>{
    var apps=readFromFile("books.json")
    var ind=apps.findIndex(o=>o.appname==appname)
    if(ind==-1)return {type:"error",message:"app does not exist"}
    else return {type:"success",data:apps[ind],message:""}
}
exports.processRegister=(reqBody)=>{
    var a=readFromFile("/bookwormUsers.json")
    let{username,lastName,emailAddress,organizationName,firstName,mobileNumber,password}=reqBody
    let verlink=generateBoken(firstName,lastName)
    a.push({
        username:username,
        firstName:firstName,
        lastName:lastName,
        emailAddress:emailAddress,
        organizationName:organizationName,
        mobileNumber:mobileNumber,
        password:password,
        verified:verlink,
        apps:[

        ]
    })
    var mailOptions = {
        from: 'api.bookworm.js@gmail.com',
        to: `${emailAddress}`,
        subject: `Welcome to bookworm-js ${username}`,
        html: ` <html>
                    <body>
                        <p>Hi ${username},</p>
                        <p>Welcome to bookworm-js</b></p>
                        <a href="https://bookworm-js.herokuapp.com/verify/${username}/${verlink}"> Please do verify your account through this link.</a>
                        <p>Thank you.</p>
                        <p> Stay Read </p>
                    </body>
                </html>`
      };
    a=JSON.stringify(a,null,"\t")
    var result=writeToFile("bookwormUsers.json",a)
    if(result){ 
        transporter.sendMail(mailOptions)
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
        var ind=a.findIndex(o=>(o.emailAddress==req.body.emailAddress||o.username==req.body.username&&o.verified==true))
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
    //console.log(a)
    var ind=a.findIndex(o=>o.username==name)
    //console.log(ind)
    a=a[ind].apps
    return a
}
exports.verify=(name,link)=>{
    var a=readFromFile("bookwormUsers.json")
    var ind=a.findIndex(o=>o.username==name)
    if(ind!=-1){
        if(link==a[ind].verified){
            a[ind].verified=true
            a=JSON.stringify(a,null,"\t")
            writeToFile("bookwormUsers.json",a)
            return {type:"success",message:"Verification Successful"}
        }
        else if(link!=a[ind].verified){
            return {type:"error",message:"Error verifying, verificaion link is invalid"}
        }
    }
    else return {type:"error",message:"Error verifying, verificaion link is invalid"}

}
exports.addApp=(app)=>{
    var {appName,username}=app
    var a=readFromFile("bookwormUsers.json")
    var b=readFromFile("apps.json")
    var c=readFromFile("books.json")
    var ind=a.findIndex(o=>o.username==username)
    if(!this.checkAppExists(appName)){
        let appboken=generateBoken(appName,username)
        a[ind].apps.push({
            appname:appName,
            appBoken:appboken
        })
        console.log("new a>> ",a)
        var mailOptions = {
            from: 'api.bookworm.js@gmail.com',
            to: `${a[ind].emailAddress}`,
            subject: 'bookworm app created',
            html: ` <html>
                        <body>
                            <p>Hi ${username},</p>
                            <p>You just created an app: <b>${appName} </b></p>
                            <p>Here is your boken : <em><i>${appboken}</i></em>. Please do keep it safe, it is required to access bookworm's API for ${appName} books.</p>
                            <p>Thank you.</p>
                            <p> Stay Read </p>
                        </body>
                    </html>`
          };
        a=JSON.stringify(a,null,"\t")
        writeToFile("bookwormUsers.json",a)
        b.push({
            appname:appName,
            appBoken:appboken,
            createdBy:username
        })
        c.push({
            appname:appName,
            appBoken:appboken,
            createdBy:username,
            books:[

            ]
        })
        b=JSON.stringify(b,null,"\t")
        c=JSON.stringify(c,null,"\t")
        writeToFile("apps.json",b)
        writeToFile("books.json",c)
        transporter.sendMail(mailOptions)
        return {type:"success",message:"Created app succesfully",appBoken:appboken}
    }
    else return false
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

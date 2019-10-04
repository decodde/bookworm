var fs=require("fs")
var path=require("path")
const Crypto = require('node-crypt');
var nodemailer = require('nodemailer');
var BookwormUsers = require('./models').BookwormUsers,Apps=require('./models').Apps,Books=require('./models').Books;
const smtpT=require('nodemailer-smtp-transport')


var transporter = nodemailer.createTransport(smtpT({
  service: 'gmail',
  host:'smtp.gmail.com',
  auth: {
    user: 'api.bookworm.js@gmail.com',
    pass: 'bookworm-js75'
  }
}));

exports.generateBookId=(x,y)=>{
    var crypto = new Crypto({
        key: 'b95d8cb128734ff8821ea634dc34334535afe438524a782152d11a5248e71b01',
        hmacKey: 'dcf8cd2a90b1856c74a9f914abbb5f467c38252b611b138d8eedbe2abb4434fc'
      });
      // Have some data you want to protect
      var unencryptedValue = x+y;
      // Encrypt it
      var encryptedValue = crypto.encrypt(unencryptedValue);
      return encryptedValue;
}
exports.generateBoken=(param1,param2)=>{
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
    apps.findOne({appname:`${appname}`}).toArray((err,data)=>{
        return {owner:`${data.createdBy}`}
    })
}
exports.checkBokenPart=(appname,boken)=>{
    var x=false
    Apps.findOne({appName:appname},(err,data)=>{
        if(data==null)false
        else{
            var partBoken= data.appBoken
            partBoken=partBoken.split("|")
            partBoken=partBoken[0]
            console.log(boken," <<>> ",partBoken)
            if(boken==partBoken){
                x=true
                return x
            }
            else {
                x=false
                return x
            }
        }
    })
    console.log(x)
    return x
}
//this.checkBokenPart
exports.checkBoken=(appname,boken)=>{
    var apps=readFromFile("apps.json")
    var ind=apps.findIndex(o=>o.appname==appname)
    //console.log(boken)
        var partBoken=apps[ind].appBoken
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
exports.deleteBook=(appname,bokenId,bookId)=>{
    var bookS=readFromFile("books.json")
    var ind=bookS.findIndex(o=>o.appname==appname&&o.appBoken==bokenId)
    if (ind==-1) return{type:"error",message:"App does not exist"}
    else {
        var ind2=bookS[ind].books.findIndex(o=>o.bookId==bookId)
        
        var newBookS=bookS[ind].books.filter(o=>o.bookId!==bookId)
        bookS[ind].books=newBookS
        //console.log("newBooks...:> ",newBookS)
        bookS=JSON.stringify(bookS,null,"\t")
        writeToFile("books.json",bookS)
        return {type:"success",message:`${bookId} Deleted Successfully`}
    }
}
exports.findBook=(appname,bokenId,bookId)=>{
    var bookS=readFromFile("books.json")
    var ind=bookS.findIndex(o=>o.appname==appname&&o.appBoken==bokenId)
    if (ind==-1) return{type:"error",message:"App does not exist"}
    else {
        var ind2=bookS[ind].books.findIndex(o=>o.bookId==bookId)
        var rtd=bookS[ind].books[ind2]
        return {type:"success",message:`${bookId} Fetched Successfully`,data:rtd}
    }
}

exports.sendEmail=(type,reqBody)=>{
    
    if (type=="register"){
        let{username,emailAddress,verificationLink}=reqBody
        var mailOptions = {
            from: 'api.bookworm.js@gmail.com',
            to: `${emailAddress}`,
            subject: `Welcome to bookworm-js ${username}`,
            html: ` <html>
                        <body>
                            <p>Hi ${username},</p>
                            <p>Welcome to bookworm-js</b></p>
                            <a href="https://bookworm-js.herokuapp.com/verify/${username}/${verificationLink}"> Please do verify your account through this link.</a>
                            <p>Thank you.</p>
                            <p> Stay Read </p>
                        </body>
                    </html>`
          };
    }
    else if(type=="newapp"){
        var mailOptions = {
            from: 'api.bookworm.js@gmail.com',
            to: `${reqBody.emailAddress}`,
            subject: 'bookworm app created',
            html: ` <html>
                        <body>
                            <p>Hi ${reqBody.username},</p>
                            <p>You just created an app: <b>${reqBody.appName} </b></p>
                            <p>Here is your boken : <em><i>${reqBody.bokenId}</i></em>. Please do keep it safe, it is required to access bookworm's API for ${reqBody.appName} books.</p>
                            <p>Thank you.</p>
                            <p> Stay Read </p>
                        </body>
                    </html>`
          };
    }
    transporter.sendMail(mailOptions)
}
exports.processRegisterError=(reqBody,a)=>{
    var result={type:"error",message:"Error Creating Account"};
    var {username,emailAddress,mobileNumber}=reqBody
    a.forEach(o=>{
        o.username==username?result={type:"error",message:"Username Exists"}:result
        o.emailAddress==emailAddress?result={type:"error",message:"Email Exists"}:result
        o.mobileNumber==mobileNumber?result={type:"error",message:"Mobile Number Exists"}:result
    })
    return result
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

exports.authenticateBoken=(appName,bokenId)=>{
    var apps=readFromFile("apps.json")
    var ind=apps.findIndex(o=>o.appname==appName&&o.appBoken==bokenId)
    if (ind==-1) return false
    else return true
}
exports.bookExists=(appName,bokenId,bookId)=>{
    var bookS=readFromFile("books.json")
    var ind=bookS.findIndex(o=>o.appname==appName&&o.appBoken==bokenId)
    var ind2=bookS[ind].books.findIndex(o=>o.bookId==bookId)
    if (ind2==-1)return false
    else return true
}
exports.addBookTo=(appName,bokenId,book)=>{
    var bookS=readFromFile("books.json")
    var ind=bookS.findIndex(o=>o.appname==appName&&o.appBoken==bokenId)
    if (ind==-1) return{type:"error",message:"App does not exist"}
    else {
        var bookId=generateBookId(book.author,book.title)
        bookId=bookId.split("|")
        bookId=bookId[0]
        var dateCreated=new Date()
        book.dateCreated=dateCreated.toUTCString()
        book.bookId=bookId
        bookS[ind].books.push(book)
        bookS=JSON.stringify(bookS,null,"\t")
        writeToFile("books.json",bookS)
        return {type:"success",message:"Book Added Successfully",bookId:bookId}
    }
}
exports.updateBook=(appName,bokenId,bookId,bookDetails)=>{
    var bookS=readFromFile("books.json")
    var ind=bookS.findIndex(o=>o.appname==appName&&o.appBoken==bokenId)
    if (ind==-1) return{type:"error",message:"App does not exist"}
    else {
        var ind2=bookS[ind].books.findIndex(o=>o.bookId==bookId)
        //bookS[ind].books[ind2]=bookDetails
        var updateKeys=Object.keys(bookDetails)
        updateKeys.forEach(o=>{
            bookS[ind].books[ind2][o]=bookDetails[o]
        })
       //55 console.log(bookS)
        var dateModified=new Date()
        bookS[ind].books[ind2].dateModified=dateModified.toUTCString()
        bookS=JSON.stringify(bookS,null,"\t")
        writeToFile("books.json",bookS)
        return {type:"success",message:`${bookId} Updated Successfully`}
    }
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

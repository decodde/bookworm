var mongoose = require('mongoose'),
 Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;
var BookwormUsers = new Schema({
username: { type: String },
firstName: { type: String },
lastName: { type: String },
emailAddress: { type: String },
organizationName: { type: String },
mobileNumber: { type: String },
password: { type: String },
verified: { type: Boolean },
verificationLink:{type:String}
});
BookwormUsers.virtual('bookwormUser').set(function(bookwormUser){
this._bookwormUser = bookwormUser;
 }).get(function() {
return this._bookwormUser;
 });
module.exports = mongoose.model('BookwormUsers', BookwormUsers);
var mongoose = require('mongoose'),
 Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;
var BooksSchema = new Schema({
appname: { type: String },
appBoken: { type: String },
createdBy: { type: String },
books: { type: Array }
});
BooksSchema.virtual('book').set(function(book){
this._book = book;
 }).get(function() {
return this._book;
 });
module.exports = mongoose.model('Books', BooksSchema);
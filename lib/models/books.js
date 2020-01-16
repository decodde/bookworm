var mongoose = require('mongoose'),
 Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var BooksSchema = new Schema([{
appName: { type: String },
appBoken: { type: String },
createdBy: { type: String },
author:String,
doi:String,
directLink:String,
journal:String,
publisher:String,
publicationYear:String,
title:String,
dateCreated:String,
abstract:String,
bookId:String,
type:String,
issue:String,
volume:String,
pages:String
}]);
BooksSchema.virtual('book').set(function(book){
this._book = book;
 }).get(function() {
return this._book;
 });

BooksSchema.methods.addBook=(book)=>{
    this.books.push(book)
    return this.books;
}
module.exports = mongoose.model('Books', BooksSchema);
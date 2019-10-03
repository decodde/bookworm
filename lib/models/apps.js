var mongoose = require('mongoose'),
 Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;
var Apps = new Schema({
appName: { type: String },
appBoken: { type: String },
createdBy: { type: String }
});
Apps.virtual('app').set(function(app){
this._app = app;
 }).get(function() {
return this._app;
 });
module.exports = mongoose.model('Apps', Apps);
let mongoose=require('mongoose');
let Schema=new mongoose.Schema({
    email:{type:String},
    password:{type:String}
})
let model=mongoose.model("frissonLogin",Schema);
module.exports={model};
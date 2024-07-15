let express=require('express');
let mongoose=require('mongoose');
let {model}=require('./Model');
let jwt=require('jsonwebtoken');
const nodemailer = require('nodemailer');
let cors=require('cors');
let app=express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({extended:true}));
function encoding(email,password){
    return jwt.sign(password,email);
} 
app.post('/login',async(req,res)=>{
    console.log(req.body);
    try{
       let result=await model.findOne({email:req.body.email,password:encoding(req.body.email,req.body.password)});
       console.log(result);
       (result)?res.status(200).json({email:result.email}):res.sendStatus(401);
       console.log("DOne   ",result.email);
    }
    catch(err){
        res.sendStatus(500);
    }
})
app.post('/signup',async (req,res)=>{
    try{
        let check= await model.findOne({email:req.body.email});
        (!check)?await model.create({email:req.body.email,password:encoding(req.body.email,req.body.password)}):res.sendStatus(403);
        res.sendStatus(200);
    }catch(err){
        res.sendStatus(500);
    }
})
app.post('/forgot', async (req, res) => {
    console.log("requesting", req.body);
    let user = await model.findOne({ email: req.body.email });
    try {
        if (user) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'sanj25524@gmail.com',
                    pass: 'jidj oapr hkgi bnpv' // Use the 16-character app password generated from Google
                }
            });

            async function main(email, password) {
                const info = await transporter.sendMail({
                    from: '"From Sanjay Password Regarding..." <sanj25524@gmail.com>',
                    to: email,
                    subject: "Password Recovery",
                    text: `Your password is: ${password}`,
                    html: `<b>Your password is: ${password}</b>`,
                });

                console.log("Message sent: %s", info.messageId);
            }

            main(req.body.email, jwt.verify(user.password, user.email));
            res.status(201).json({ "message": "Email sent successfully" });
        } else {
            res.status(401).json({ "message": "User not found" });
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});
mongoose.connect('mongodb+srv://sanjaysoman46:sanjay123@frisson.1nliflp.mongodb.net/?retryWrites=true&w=majority&appName=frisson').then(()=>app.listen(8080,()=>console.log("Server Connected"))).catch(err=>console.log(err,"Error At Connection"));

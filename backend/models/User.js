const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please Enter a name."]
    },
    avatar:{
         public_id:String,
         url:String
    },
    email:{
        type:String,
        required:[true,"Please enter an email."],
        unique:[true,"Email already exists."]
    },
    password:{
        type:String,
        required:[true,"Enter an password."],
        minlength:[6,"Password must be atleast 6 characters."],
        select:false   //when we access data of any user all data except password is accessed
    },
    posts:[
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
       }
    ],
    followers:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    following:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    resetPasswordToken:String,
    resetPasswordExpire:Date

})

userSchema.pre("save",async function(next){
    // this runs whenever user sets new password and changes anydata but incase password is not chaged but other details are changed
    // this function will again hased the hased password which is not what we want that's why we are using if codition 
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,10)
    }
    // this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateToken = async function(){
    return jwt.sign({_id:this._id},process.env.JWT_SECRET)
}

userSchema.methods.getResetPasswordToken = async function(){
    const resetToken = crypto.randomBytes(20).toString("hex")
    console.log(resetToken)
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    this.resetPasswordExpire = Date.now() + 10*60*1000
    return resetToken
}
module.exports = mongoose.model("User",userSchema)
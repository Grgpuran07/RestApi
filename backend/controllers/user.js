const { use } = require("../app");
const Post = require("../models/Post");
const User = require("../models/User")
const sendEmail = require("../middlewares/sendEmail")

exports.register = async (req,res)=>{
       try{

        const {name,email,password} = req.body;
        let user = await User.findOne({email});
        if(user){
            return res.status(400).json({sucess:false,message:"User already exists."})
        }

        user = await User.create({name,email,password,avatar:{public_id:"sample id",url:"sample url"}})
        
        const token = await user.generateToken();
        const options = {
            expires : new Date(Date.now() + 90*24*60*60*1000),
            httpOnly : true
        }

        res.status(200).cookie("token",token,options).json({
            sucess:true,
            user,
            token
        })

       }catch(err){
        res.status(500).json({sucess:false,
        message:err.message})
       }
}

exports.logout = async (req,res) =>{
    try{
        res.status(200).cookie("token",null,{expires:new Date(Date.now()),httpOnly:true}).json({
            sucess:true,
            message: "Logged Out."
        })

    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
    }
}

exports.login = async (req,res) =>{
    try{
        const {email,password} = req.body;
        // console.log(email)
        // console.log(password)

        const user = await User.findOne({email}).select("+password")
        // console.log(user)
        if(!user){
           return res.status(501).json({sucess:false,message:"User does not exist."})
        }

        const isMatch = await user.matchPassword(password)

        if(!isMatch){
            return res.status(400).json({
                sucess:false,
                message:"Incorrect Password."
            })
        }

        const token = await user.generateToken();
        const options = {
            expires : new Date(Date.now() + 90*24*60*60*1000),
            httpOnly : true
        }

        res.status(200).cookie("token",token,options).json({
            sucess:true,
            user,
            token
        })

    }catch(err){
         res.status(500).json({
            sucess:false,
            message:err.message
         })
    }
}

exports.followUser = async(req,res)=>{
    try{

        const userToFollow = await User.findById(req.params.id)
        const loggedInUser = await User.findById(req.user._id)

        if(!userToFollow){
            return res.status(404).json({
                sucess:false,
                messsage:"User not exist"
            })
        }
        
        if(loggedInUser.following.includes(userToFollow._id)){
            const index = loggedInUser.following.indexOf(userToFollow._id)
            loggedInUser.following.splice(index,1)

            const indextwo = userToFollow.followers.indexOf(loggedInUser._id)
            userToFollow.followers.splice(indextwo,1)

            await loggedInUser.save()
            await userToFollow.save()
            return res.status(404).json({
                sucess:false,
                message:"User is Unfollowed."
            })
        }else{
            loggedInUser.following.push(userToFollow._id)
            userToFollow.followers.push(loggedInUser._id)

             await loggedInUser.save()
             await userToFollow.save()

             res.status(400).json({
                 sucess:true,
                 message:"User followed"
             })

        }

         

    }catch(err){
        res.status(500).json({sucess:false,
        message:err.message})
    }
}

exports.updatePassword = async (req,res)=>{
    try{

        const user = await User.findById(req.user._id).select("+password")
        const {oldPassword,newPassword} = req.body

        if(!oldPassword || !newPassword){
            return res.status(404).json({
                sucess:false,
                message:"Please provide old password and new password."
            })
        }

        const isMatch = await user.matchPassword(oldPassword)
        if(!isMatch){
            return res.status(404).json({
                sucess:false,
                message:"Password Incorrect."
            })
        }

        user.password = newPassword;
        await user.save()

        res.status(200).json({
            sucess:true,
            message:"Password Updated."
        })

    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
    }
}

exports.updateProfile = async(req,res) =>{
    try{
        const user = await User.findById(req.user._id)

        const {name,email} = req.body

        if(name){
            user.name = name
        }
        if(email){
            user.email = email
        }

        // use avatar todo
        await user.save()

        res.status(200).json({
            sucess:true,
            message:"Update done sucessfully."
        })


    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
    }
}

exports.deleteMyProfile = async (req,res) =>{
      try{
           const user = await User.findById(req.user._id)
           const posts = user.posts
        //    console.log(user.following)
           const userFollowing = user.following
        //    console.log(userFollowing)
           const userFollowers = user.followers
           console.log(userFollowers)
           const userid = user._id
           
           await user.remove()
        //    logout of user
            res.cookie("token",null,{
            expires: new Date(Date.now()),
            httpOnly:true
        })

        //    Deleting all post of user

           for(let i=0;i<posts.length;i++){
            const post = await Post.findById(posts[i]);
            await post.remove()
           }

           //deleting userid from id of user following
           for(let i=0;i<userFollowing.length;i++){
            const followed = await User.findById(userFollowing[i]);
            // console.log(followed.followers)

            const index =  followed.followers.indexOf(userid)
            followed.followers.splice(index,1)
            await followed.save()

            // deleting userid from user followers following
            for(let i=0;i<userFollowers.length;i++){
                const userFollower = await User.findById(userFollowers[i])
                console.log(userFollower)
                const index = userFollower.following.indexOf(userid)
                userFollower.following.splice(index,1)
                await userFollower.save()
            }


           }

           res.status(200).json({
            sucess:true,
            message:"Profile Deleted Sucessfully."
           })
      }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
      }

}

exports.myProfile = async(req,res)=>{
      try{
        const user = await User.findById(req.user._id).populate("posts")
        res.status(200).json({
            sucess:true,
            user
        })

      }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
      }
}

exports.getUserProfile = async(req,res)=>{
    try{
        const user = await User.findById(req.params.id).populate("posts")
        if(!user){
            return res.status(404).json({
                sucess:false,
                message:"User doesn't exist"
            })
        }

        res.status(200).json({
            sucess:true,
            user
        })
        
    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
    }
}

exports.getAllUsers = async(req,res)=>{
    try{

        const users = await User.find({})

        res.status(200).json({
            sucess:true,
            users
        })

    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
    }
}

exports.forgetFunction = async(req,res)=>{
    try{
        const user = await User.findOne({email:req.body.email})

        if(!user){
            return res.status(404).json({
                sucess:false,
                message:"Email not found"
            })
        }

        const resetPasswordToken = user.getResetPasswordToken();
        await user.save()
        const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`
        const message = `Reset your password by clicking on the link below:\n\n${resetUrl}`
        try{
            await sendEmail({email:user.email,subject:"Reset Password",message})
            res.status(200).json({
                sucess:true,
                message:`Email sent to ${user.email}`
            })

        }catch(err){
            user.resetPasswordToken = undefined,
            user.resetPasswordExpire = undefined
            await user.save()
            res.status(500).json({
                sucess:false,
                message:err.message
            })

        }

    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
    }
}
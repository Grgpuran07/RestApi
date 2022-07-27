const Post = require("../models/Post");
const User = require("../models/User");

exports.createPost = async (req,res) =>{
    try{
        const newPostData = {
            caption:req.body.caption,
            image:{
                public_id:"req.body.public_id",
                url:"req.body.url"
            },
            owner:req.user._id
        }

        const post = await Post.create(newPostData);
        const user = await User.findById(req.user._id);
        user.posts.push(post._id)
        await user.save()

        res.status(201).json({
            status:true,
            post
        })

    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
    }

}

exports.deletePost = async(req,res) =>{
    try{
        const post = await Post.findById(req.params.id)

        if(!post){
            return res.status(404).json({
                sucess:false,
                message:"Post not found."
            })
        }

        if(post.owner.toString() != req.user._id.toString() ){
            return res.status(401).json({
                sucess:false,
                message:"Unauthorized."
            })
        }

        await post.remove()

        const user = await User.findById(req.user._id)
        const index = user.posts.indexOf(req.params.id)
        user.posts.splice(index, 1)
        await user.save()

        res.status(200).json({
            sucess:true,
            message:"Post Deleted."
        })


    }catch(err){
         res.status(500).json({sucess:false,
        message:err.message})
    }
}

exports.likeAndUnlikePost = async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            res.status(404).json({
                sucess:false,
                message:"Post not found."
            })
        }

        if(post.likes.includes(req.user._id)){
             const index = post.likes.indexOf(req.user._id)
             post.likes.splice(index, 1)

             await post.save()
             res.status(200).json({sucess:true,
            message:"Post Unliked."})
        }else{
            post.likes.push(req.user._id);
            await post.save()
            res.status(200).json({
                sucess:true,
                message:"Post Liked"
            })
        }


        // post.likes.push(req.user._id)

    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message,
        })
    }
}

exports.getPostOfFollowing = async (req,res) =>{
    try{
        const user = await User.findById(req.user._id)
        const posts = await Post.find({
            owner:{
                $in:user.following,
            }
        })

        res.status(400).json({
            sucess:true,
            posts
        })

    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
    }
}

exports.updateCaption = async(req,res) =>{
   try{
    const post = await Post.findById(req.params.id)
    if(!post){
        return res.status(404).json({
            sucess:false,
            message:"Post not found"
        })
    }

    if(post.owner.toString() != req.user._id.toString()){
        return res.status(401).json({
            sucess:false,
            message:"Unauthorized user."
        })
    }

    post.caption = req.body.caption
    await post.save()
    res.status(200).json({
        sucess:true,
        message:"Post Updated sucessfully."
    })


   }catch(err){
    res.status(500).json({
        sucess:false,
        message:err.message
    })
   }
}

exports.commentAddUpdate = async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id)
        if(!post){
            return res.status(404).json({
                sucess:false,
                message:"Post does not exists."
            })
        } 

        let commentexist = -1;
        post.comments.forEach((currentpost,index)=>{
            if(currentpost.user.toString() === req.user._id.toString()){
                commentexist = index;
            }
        })

        // Checking is user has already comment and want to update

       if(commentexist !== -1){
           post.comments[commentexist].comment = req.body.comment;
           await post.save()
           return res.status(200).json({
            sucess:true,
            message:"Comment Updated."
           })

       }else{
        post.comments.push({
            user:req.user._id,
            comment:req.body.comment
        })
        await post.save()
        return res.status(200).json({
            sucess:true,
            message:"Comment added"
        })
       }



    }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
    }
}

exports.deleteComment = async(req,res) =>{
      try{
        const post = await Post.findById(req.params.id)
        if(!post){
            return res.status(404).json({
                sucess:fasle,
                message:"Post does not exists."
            })
        }

    // Checking if owner wants to delete comment

    if(post.owner.toString() === req.user._id.toString()){
      if(req.body.commentId === undefined){
        return res.status(404).json({
            sucess:false,
            message:"Comment id is required."
        })
      }
        post.comments.forEach((currElement,index)=>{
            if(currElement._id.toString() === req.body.commentId.toString()){
                return post.comments.splice(index,1)
            }
        })
        await post.save()
        res.status(200).json({
            sucess:true,
            message:"Selected comment is deleted."
        })
    }else{
        post.comments.forEach((currElement,index)=>{
            if(currElement.user.toString() === req.user._id.toString()){
                   return post.comments.splice(index,1)
            }
        })

        await post.save()
        return res.status(200).json({
            sucess:true,
            message:"Your comment is deleted."
        })
    }

      }catch(err){
        res.status(500).json({
            sucess:false,
            message:err.message
        })
      }
}
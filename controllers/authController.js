import User from "../models/users.model.js";
import axios from "axios";
import qs from "qs";
import jwt from "jsonwebtoken";
import stream from 'stream';
import cloudinary from '../cloudinary.config.js';

export const discordAuth = (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${
    process.env.DISCORD_CLIENT_ID
  }&redirect_uri=${encodeURIComponent(
    process.env.DISCORD_REDIRECT_URI
  )}&response_type=code&scope=identify+email`;
  res.redirect(discordAuthUrl);
};

export const discordRedirectAuth = async (req, res) => {
console.log('redirec disc')
  try {
    
    const code = req.query.code;

    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      qs.stringify({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
   let  cloudinaryId
    const userResponse = await axios.get(
      "https://discord.com/api/v10/users/@me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userData = userResponse.data;

    async function fetchAvatar(userId, avatarHash) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=512`;
        
        try {
            // Fetch the avatar image
            const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data, 'binary');
            return imageBuffer;
        } catch (error) {
            console.error('Error fetching avatar:', error);
            return null;
        }
    }
   

async function uploadToCloudinary(imageBuffer) {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'discord_avatars' },
        (error, result) => {
          if (error) {
            console.error('Error uploading to Cloudinary:', error);
            reject(error);
          } else {
            resolve({url:result.secure_url,publicId: result.public_id});
          }
        }
      );

      const bufferStream = new stream.PassThrough();
      bufferStream.end(imageBuffer);
      bufferStream.pipe(uploadStream);
      return uploadStream
    });
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    return 'https://res.cloudinary.com/dao9osuwj/image/upload/v1723979986/discord_avatars/rdkuf62szqkxegb78lsq.png';
  }
}

async function deleteFromCloudinary(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log('Old image deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('Error deleting old image from Cloudinary:', error);
  }
}


    let user = await User.findOne({ userId: userData.id });
    let userAvatar
    let userAvatarHash
    if(user && user.avatarHash!==userData.avatar){
        userAvatarHash=userData.avatar
        const imageBuffer = await fetchAvatar(userData.id, userData.avatar);
        if (imageBuffer) {
            let {url,publicId} = await uploadToCloudinary(imageBuffer);

            userAvatar=url
            cloudinaryId=publicId
            if (user.cloudinaryId) {
              await deleteFromCloudinary(user.cloudinaryId);
            }
            
        } else {
            userAvatar=userData.avatar
            console.error('Failed to fetch Discord avatar.');
        }
    }
    else if(!user){
      const imageBuffer = await fetchAvatar(userData.id, userData.avatar);
      if (imageBuffer) {
          let {url,publicId} = await uploadToCloudinary(imageBuffer);
          userAvatarHash=userData.avatar
          userAvatar=url
          cloudinaryId=publicId
      } else {
          userAvatar=userData.avatar
          console.error('Failed to fetch Discord avatar.');
      }
    }
    if (user) {
        user.email = userData.email;
        user.avatar=userAvatar?userAvatar:user.avatar||"";
        user.avatarHash=userAvatarHash?userAvatarHash:user.avatarHash||""
        user.cloudinaryId=cloudinaryId
        user.globalName = userData.global_name;
        await user.save();
      } else {
        user = new User({
          userId: userData.id,
          email: userData.email,
          avatarHash:userAvatarHash?userAvatarHash:'',
          cloudinaryId:cloudinaryId?cloudinaryId:'',
          avatar: userAvatar?userAvatar:userData.avatar||"",
          globalName: userData.global_name,
        });
        await user.save();
      }
  

    const token = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        avatar: userData.avatar||'',
        globalName: userData.global_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'None',
      maxAge: 4 * 60 * 60 * 1000,
      path: '/',
    });
    res.redirect(`${process.env.CLIENT_ENDPOINT}/`);
    console.log(user,token)
    // res.json(user);
  } catch (error) {
    console.error(
      "Error during Discord OAuth2 process:",
      error.response ? error.response.data : error.message
    );
    res.status(500).send("Internal Server Error");
  }
};

export const getUser = async (req, res) => {
    const getUser = await User.aggregate([
      {
        $match: {
          userId: req.user.userId
        }
      },
      {
        $lookup: {
          from: "locations", 
          localField: "userId", 
          foreignField: "userId", 
          as: "locations"
        }
      },
      {
        $unwind: {
          path: "$locations",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          email: 1,
          avatar: 1,
          globalName: 1,
          visibility: "$locations.visibility"
        }
      }
    ]);
    res.send(getUser);
};

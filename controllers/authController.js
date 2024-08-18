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

//     async function uploadToImgur(imageBuffer) {
//         const imgurUrl = 'https://api.imgur.com/3/image';
        
//         try {

// const instance = axios.create({
//   baseURL: 'https://api.imgur.com/3/',
//   timeout: 10000,  // 10 seconds
// });
//  const response =await instance.post(imgurUrl, imageBuffer,
//   {
//     headers: {
//         Authorization: `Client-ID ${process.env.IMGUR_CLIENTID}`,
//         'Content-Type': 'application/octet-stream'
//     }
// })
//             // const response = await axios.post(imgurUrl, imageBuffer, {
//             //     headers: {
//             //         Authorization: `Client-ID ${process.env.IMGUR_CLIENTID}`,
//             //         'Content-Type': 'application/octet-stream'
//             //     }
//             // });
//             // console.log(response,'respo')
//             return response.data.data.link;
//         } catch (error) {
//             console.error('Error uploading to Imgur:', error);
//             return '';
//         }
//     }
   

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
            resolve(result.secure_url);
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


    let user = await User.findOne({ userId: userData.id });
    let userAvatar
    if(!user||!user.avatar && userData.avatar){
        const imageBuffer = await fetchAvatar(userData.id, userData.avatar);
        if (imageBuffer) {
            userAvatar = await uploadToCloudinary(imageBuffer);
            
        } else {
            userAvatar=userData.avatar
            console.error('Failed to fetch Discord avatar.');
        }
    }
  
    if (user) {
        user.email = userData.email;
        user.avatar=userAvatar?userAvatar:userData.avatar||"";
        // user.avatar='';
        user.globalName = userData.global_name;
        await user.save();
      } else {
        user = new User({
          userId: userData.id,
          email: userData.email,
          // avatar:'',
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
    res.redirect(`${process.env.CLIENT_ENDPOINT}`);
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

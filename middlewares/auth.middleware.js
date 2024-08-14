import jwt from "jsonwebtoken";


export const authenticateJWT = (req, res, next) => {

    const token = req.cookies.auth_token; 
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  
  if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403); 
        }
  
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401); // No token provided
    }



    // const token = req.headers.authorization?.split(' ')[1];
  
    // if (token) {
    //   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    //     if (err) {
    //       return res.sendStatus(403); 
    //     }
  
    //     req.user = user;
    //     next();
    //   });
    // } else {
    //   res.sendStatus(401); // No token provided
    // }
  };
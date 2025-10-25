import jwt from 'jsonwebtoken'

export const authenticateToken = (req, res, next) => {
    if(req.originalUrl.startsWith("/auth")){
        next();
    }


const authHeader = req.headers["authorization"];
 if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
}

const token = authHeader.split(" ")[1];
if(!token){
    return res.status(401).json({ message: "Token missing" });
}

try {
    const decoded = jwt.verify(token,process.env.ACCESS_SECRET);
    req.user = decoded;
    next()
} catch (error) {
    return res.status(401).json({ message: "Invalid or expired access token" });
}
};
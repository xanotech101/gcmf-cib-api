const jwt = require("jsonwebtoken");

function superUserAuth(req, res, next) {

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    try {
      if (token == null)
        return res.sendStatus(401).send("Access denied. No token provided.");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded)
        if (!decoded.priviledge.includes("superUser")) return res.status(403).send("Access denied. You are not authorized to perform this action");
          req.user = decoded.id;
          next();
    } catch (ex) {
        console.log(ex)
        res.status(400).send("Invalid token.");
    }
}

module.exports = superUserAuth;
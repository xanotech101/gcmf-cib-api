const jwt = require("jsonwebtoken");

function superUserAuth(req, res, next) {

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    try {
      if (token == null)
        return res.sendStatus(401).send("Access denied. No token provided.");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if ( !decoded.priviledge.includes("superUser"))
          return res
            .status(403)
            .send(
              "Access denied. You are not authorized to perform this action"
            );
          req.user = decoded;
          next();
    } catch (ex) {
        console.log(ex)
        res.status(400).send("Invalid token.");
    }
}



function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
     
    if (token == null)
      return res.sendStatus(401).send("Access denied. No token provided.");
;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const arr = decoded.priviledge

    if ( !arr.includes("admin") && !arr.includes("superUser"))
      return res
        .status(403)
        .json({message: "Access denied. You are not authorized to perform this action"})
    
    req.user = decoded;

    next();
  } catch (ex) {
    console.log(ex);
    return res.status(401).send("Invalid token.");
  }
}

function initiatorAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    if (token == null)
      return res.sendStatus(401).send("Access denied. No token provided.");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const arr = decoded.priviledge;

    if (
      !arr.includes("initiator") &&
      !arr.includes("superUser") &&
      !arr.includes("admin")
    )
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
      });

    req.user = decoded;
    next();
  } catch (ex) {
    console.log(ex);
    return res.status(401).send("Invalid token.");
  }
}




function verifierAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    if (token == null)
      return res.sendStatus(401).send("Access denied. No token provided.");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const arr = decoded.priviledge;
    if (
      !arr.includes("verifier") &&
      !arr.includes("superUser") &&
      !arr.includes("admin")
    )
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
      });

    req.user = decoded;
    console.log("I am here in line 5");
    next();
  } catch (ex) {
    console.log(ex);
    return res.status(401).send("Invalid token.");
  }
}



function allUsersAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    if (token == null)
      return res.sendStatus(401).send("Access denied. No token provided.");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const arr = decoded.priviledge;
    if (
       !arr.includes("verifier") &&
      !arr.includes("superUser") &&
      !arr.includes("admin") &&
          !arr.includes("initiator")
    )
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
      });

    req.user = decoded;
    next();
  } catch (ex) {
    console.log(ex);
    return res.status(401).send("Invalid token.");
  }
}

module.exports = {
  superUserAuth,
  adminAuth,
  initiatorAuth,
  verifierAuth,
  allUsersAuth,
}; 
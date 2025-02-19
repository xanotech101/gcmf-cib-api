const jwt = require("jsonwebtoken");
const thirdPartyModel = require("../model/thirdParty.model");
const { toISOLocal } = require("../utils/utils");
const thirdPartyRequestCOuntModel = require("../model/thirdpartyCount.model");

function superUserAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    if (!token) {
      return res.status(401).send({
        message: "Access denied. No token provided.",
        data: null,
        status: "failed",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.privileges.includes("superUser")) {
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
        data: null,
        status: "failed",
      });
    }
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    if (!token) {
      return res.sendStatus(401).send({
        message: "Access denied. No token provided.",
        data: null,
        status: "failed",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const arr = decoded.privileges;
    const role = decoded.role

    if (!arr.includes("admin") && !arr.includes("superUser")) {
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
        data: null,
        status: "failed",
      });
    }

    req.user = decoded;

    next();
  } catch (ex) {
    return res.status(401).send("Invalid token.");
  }
}

function initiatorAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    if (!token) {
      return res.sendStatus(401).send({
        message: "Access denied. No token provided.",
        data: null,
        status: "failed",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const arr = decoded.privileges;

    if (
      !arr.includes("initiator") &&
      !arr.includes("superUser") &&
      !arr.includes("admin")
    ) {
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
        data: null,
        status: "failed",
      });
    }

    req.user = decoded;
    next();
  } catch (ex) {
    return res.status(401).send("Invalid token.");
  }
}

function verifierAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    if (!token) {
      return res.sendStatus(401).send({
        message: "Access denied. No token provided.",
        data: null,
        status: "failed",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const arr = decoded.privileges;
    if (
      !arr.includes("verifier") &&
      !arr.includes("superUser") &&
      !arr.includes("admin")
    ) {
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
        data: null,
        status: "failed",
      });
    }
    req.user = decoded;
    next();
  } catch (ex) {
    console.log(ex);
    return res.status(401).send("Invalid token.");
  }
}

function authoriserAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    if (!token) {
      return res.sendStatus(401).send({
        message: "Access denied. No token provided.",
        data: null,
        status: "failed",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const arr = decoded.privileges;
    if (
      !arr.includes("authoriser") &&
      !arr.includes("superUser") &&
      !arr.includes("admin")
    ) {
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
        data: null,
        status: "failed",
      });
    }
    req.user = decoded;
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
    if (!token) {
      return res.sendStatus(401).send({
        message: "Access denied. No token provided.",
        data: null,
        status: "failed",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const arr = decoded.privileges;
    if (
      !arr.includes("verifier") &&
      !arr.includes("superUser") &&
      !arr.includes("admin") &&
      !arr.includes("initiator") &&
      !arr.includes("authoriser") &&
      !arr.includes("organizationLabelAdmin")
    ) {
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
        data: null,
        status: "failed",
      });
    }

    req.user = decoded;

    next();
  } catch (ex) {
    console.log(ex);
    return res.status(401).send("Invalid token.");
  }
}

function organizationLabelAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  try {
    if (!token) {
      return res.sendStatus(401).send({
        message: "Access denied. No token provided.",
        data: null,
        status: "failed",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const arr = decoded.privileges;
    const role = decoded.role

    if (!arr.includes("organizationLabelAdmin") && !arr.includes("superUser")) {
      return res.status(403).json({
        message: "Access denied. You are not authorized to perform this action",
        data: null,
        status: "failed",
      });
    }

    req.user = decoded;

    next();
  } catch (ex) {
    return res.status(401).send("Invalid token.");
  }
}

async function validateThirdPartyAuthorization(req, res, next) {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided'
      });
    }

    const token = req.headers.authorization;
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Token has expired'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token'
      });
    }

    const user = decoded.organization_name;

    const checkUser = await thirdPartyModel.findOne({ organization_name: user });
    if (!checkUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not found'
      });
    }

    if (req.body.requestType === 'bvn') {
      await thirdPartyRequestCOuntModel.create({
        userid: checkUser._id,
        requestType: 'Bvn'
      });
    } else if (req.body.requestType === 'transferRequest') {
    } else {
      await thirdPartyRequestCOuntModel.create({
        userid: checkUser._id,
        requestType: 'NameEnquiry'
      });
    }

    req.user = checkUser;
    next();
    
  } catch (error) {
    console.error('Authorization Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
}

module.exports = {
  superUserAuth,
  adminAuth,
  initiatorAuth,
  verifierAuth,
  allUsersAuth,
  authoriserAuth,
  validateThirdPartyAuthorization,
  organizationLabelAdminAuth
};

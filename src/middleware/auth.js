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
  const token = req.headers.authorization;
  try {
    if (!token) {
      return res.status(401).send({
        message: "Access denied. No token provided.",
        data: null,
        status: "failed",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
    
  } catch (error) {
    return res.status(400).json('Invalid token.');
  }
}

async function recordRequestCount(req, res, next) {
  try {
    
    const requestType =
      req.body.requestType === "bvn"
        ? "Bvn"
        : req.body.requestType === "transferRequest"
        ? "TransferRequest"
        : "NameEnquiry";

    console.log(requestType.toLowerCase());

    Promise.allSettled([
      thirdPartyRequestCOuntModel.create({
        userid: req.user.organization_id,
        requestType,
      }),
    ]).catch(console.error);

    next(); 
  } catch (err) {
    console.error(err);
    return res.status(400).json("Invalid request.");
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
  organizationLabelAdminAuth,
  recordRequestCount
};

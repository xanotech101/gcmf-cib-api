const AuditTrail = require("../model/auditTrail");

const getAllAuditTrail = async (req, res) => {
  try {
    let trails = await AuditTrail.find();
    res
      .status(200)
      .json({ message: "Audit trail fetcehd successfully", trails });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  getAllAuditTrail
};
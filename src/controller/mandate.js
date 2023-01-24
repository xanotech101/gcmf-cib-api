const Mandate = require("../model/mandate");
const bcrypt = require("bcrypt");
const {
  validateMandateSchema,
  validateUpdateMandateSchema,
} = require("../utils/utils");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const Joi = require("joi");

//@desc     register a mandate
//@route    POST /mandate/register
//@access   Public

const registerMandate = async (req, res) => {

  try {
    const { error } = validateMandateSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const mandateExists = await Mandate.findOne({ name: req.body.name });
    if (mandateExists)
      return res.status(400).json({ message: "Mandate name already exists" });

    let amount = await Mandate.find({}).select("minAmount maxAmount -_id");
    
    let mandateCheckFailed;
    if (amount.length > 0){
      amount.map((item) => {
        if (
          item.minAmount <= req.body.minAmount &&
          item.maxAmount >= req.body.minAmount || item.minAmount <= req.body.maxAmount && item.maxAmount >= req.body.maxAmount
        ) {
          mandateCheckFailed = true;
        }
      });
console.log(mandateCheckFailed);
      if (mandateCheckFailed)
        return res
          .status(400)
          .json({
            message:
              "Mandate amount is overlapping with amount registered in another mandate",
          });
    }
    const mandate = new Mandate({
      name: req.body.name,
      minAmount: req.body.minAmount,
      maxAmount: req.body.maxAmount,
      AuthorizerID: req.body.AuthorizerID,
    });

    const result = await mandate.save();
    return res.status(201).json({
      status: "success",
      message: "Mandate created successfully",
      details: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

//@desc     register a mandate
//@route    POST /mandate/register
//@access   Public

const updateMandate = async (req, res) => {
  try {
    const { error } = validateUpdateMandateSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const mandate = await Mandate.findOne({ name: req.body.name });

     let amount = await Mandate.find({}).select("minAmount maxAmount");
     mandateCheckFailed = amount.map((item) => {
       if (!
         (item.minAmount <= req.body.minAmount && 
           item.maxAmount >= req.body.minAmount) ||
         (item.minAmount <= req.body.maxAmount &&
           item.maxAmount >= req.body.maxAmount)
       ) {
         return true;
       }
     });

     if (mandateCheckFailed)
       return res.status(400).json({
         message:
           "Mandate amount is overlapping with amount registered in another mandate",
       });
    
   
          mandate.name = req.body.name
          mandate.minAmount = req.body.minAmount
          mandate.maxAmount =  req.body.maxAmount
          mandate.AuthorizerID = req.body.AuthorizerID


    if (!mandate)
      return res.status(400).json({ message: "This mandate doesn't exist" });

    const result = await mandate.save();
    return res.status(200).json({
      status: "success",
      message: "Mandate updated successfully",
      details: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerMandate,
  updateMandate,
};

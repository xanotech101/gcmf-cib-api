const Mandate = require("../model/mandate.model");
const { validateUpdateMandateSchema } = require("../utils/utils");

//@desc     register a mandate
//@route    POST /mandate/register
//@access   Public

const registerMandate = async (req, res) => {
  try {
    const mandateExists = await Mandate.findOne({ name: req.body.name });
    if (mandateExists) {
      return res.status(400).json({
        message: "Mandate name already exists",
        status: "failed",
      });
    }

    let amount = await Mandate.find({}).select("minAmount maxAmount");

    let mandateCheckFailed;

    if (amount.length > 0) {
      amount.map((item) => {
        if (
          (item.minAmount <= req.body.minAmount &&
            item.maxAmount >= req.body.minAmount) ||
          (item.minAmount <= req.body.maxAmount &&
            item.maxAmount >= req.body.maxAmount)
        ) {
          mandateCheckFailed = true;
        }
      });
      console.log(mandateCheckFailed);

      if (mandateCheckFailed) {
        return res.status(400).json({
          message:
            "Mandate amount is overlapping with amount registered in another mandate",
          status: "failed",
        });
      }
    }

    const mandate = new Mandate({
      name: req.body.name,
      minAmount: req.body.minAmount,
      maxAmount: req.body.maxAmount,
      authorizers: req.body.authorizers,
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

//@desc     update a mandate
//@route    POST /mandate/update
//@access   Public

const updateMandate = async (req, res) => {
  try {
    const { error } = validateUpdateMandateSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const mandate = await Mandate.findOne({ name: req.body.name });

    let amount = await Mandate.find({}).select("minAmount maxAmount");

    let mandateCheckFailed;

    amount.map((item) => {
      if (
        item.name !== req.body.name &&
        ((item.minAmount <= req.body.minAmount &&
          item.maxAmount >= req.body.minAmount) ||
          (item.minAmount <= req.body.maxAmount &&
            item.maxAmount >= req.body.maxAmount))
      ) {
        mandateCheckFailed = true;
      }
    });
    console.log(mandateCheckFailed);
    if (mandateCheckFailed)
      return res.status(400).json({
        message:
          "Mandate amount is overlapping with amount registered in another mandate",
      });

    mandate.name = req.body.name;
    mandate.minAmount = req.body.minAmount;
    mandate.maxAmount = req.body.maxAmount;
    mandate.authorizers = req.body.authorizers;

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

const getAllMandates = async (req, res) => {
  try {
    const mandate = await Mandate.find().populate(["authorizers"]);
    return res.status(200).json({
      message: "Request Successful",
      mandate,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getSingleMandate = async (req, res) => {
  const id = req.params.id;
  try {
    const mandate = await Mandate.findById(id.toString()).populate(
      "authorizers"
    );

    return res.status(200).json({
      message: "Request Successful",
      mandate,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerMandate,
  updateMandate,
  getAllMandates,
  getSingleMandate,
};

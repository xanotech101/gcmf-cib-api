const Mandate = require("../../model/mandate.model");
const { validateUpdateMandateSchema } = require("../../utils/utils");
const { PER_PAGE } = require("../../utils/constants");
const User = require("../../model/user.model");
const Joi = require("joi");

//@desc     register a mandate
//@route    POST /mandate/register
//@access   Public
const registerMandate = async (req, res) => {
  try {
    
    const { organizationId } = req.user;
    const mandateExists = await Mandate.findOne({ name: req.body.name, organizationId: organizationId });
    if (mandateExists) {
      return res.status(400).json({
        message: "Mandate name already exists",
        status: "failed",
      });
    }

    let mandateCheckFailed = false;
    let overlap = {};

    const existingMandates = await Mandate.find({
      organizationId: organizationId,
    }).select("name minAmount maxAmount");

    if (existingMandates.length > 0) {
      existingMandates.forEach((item) => {
        if (
          (item.minAmount <= req.body.minAmount &&
            item.maxAmount >= req.body.minAmount) ||
          (item.minAmount <= req.body.maxAmount &&
            item.maxAmount >= req.body.maxAmount)
        ) {
          mandateCheckFailed = true;
          overlap.minAmount = item.minAmount;
          overlap.maxAmount = item.maxAmount;
          overlap.name = item.name;
        }
      });

      if (mandateCheckFailed) {
        return res.status(400).json({
          message: `Mandate amount is overlapping an already registered mandate which is ${overlap.name} with a minimum amount of ${overlap.minAmount} and a maximum amount of ${overlap.maxAmount}`,
          status: "failed",
        });
      }


      const mine = await User.findById(req.user._id);

      const mandate = new Mandate({
        name: req.body.name,
        minAmount: req.body.minAmount,
        maxAmount: req.body.maxAmount,
        authoriser: req.body.authoriser,
        organizationId: mine.organizationId.toString(),
        verifiers: req.body.verifiers,
      });

      mandate.numberOfVerifiers = mandate.verifiers.length;

      const result = await mandate.save();

      return res.status(201).json({
        status: "success",
        message: "Mandate created successfully",
        details: result,
      });

    } else {

      if(req.body.minAmount !== 0){
        return res.status(400).json({
          status: "failed",
          message: "minAmount must be from 0",
        });
      }
      const mine = await User.findById(req.user._id);

      const mandate = new Mandate({
        name: req.body.name,
        minAmount: req.body.minAmount,
        maxAmount: req.body.maxAmount,
        authoriser: req.body.authoriser,
        organizationId: mine.organizationId.toString(),
        verifiers: req.body.verifiers,
      });

      mandate.numberOfverifier = mandate.verifiers.length;

      const result = await mandate.save();

      return res.status(201).json({
        status: "success",
        message: "Mandate created successfully",
        details: result,
      });
    }

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

    const updateMandate = (mandate) => (payload) =>
      mandate.validate(payload, { abortEarly: false });


    const { error } = updateMandate(req.body)
    // validateUpdateMandateSchema(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const mandate = await Mandate.findOne({ name: req.body.name });

    let amount = await Mandate.find({}).select("minAmount maxAmount name");

    let mandateCheckFailed;

    let overlap = {};

    amount.map((item) => {
      if (
        item.name !== req.body.name &&
        ((item.minAmount <= req.body.minAmount &&
          item.maxAmount >= req.body.minAmount) ||
          (item.minAmount <= req.body.maxAmount &&
            item.maxAmount >= req.body.maxAmount))
      ) {

        mandateCheckFailed = true;
        overlap.minAmount = item.minAmount;
        overlap.maxAmount = item.maxAmount;
        overlap.name = item.name;
      }
    });

    if (mandateCheckFailed)
      return res.status(400).json({
        message:
          `Mandate amount is overlapping an already registered mandate which is ${overlap.name} with minimum amount of ${overlap.minAmount} and maximum amount of ${overlap.maxAmount}`
      });

    mandate.name = req.body.name;
    mandate.minAmount = req.body.minAmount;
    mandate.maxAmount = req.body.maxAmount;
    mandate.verifiers = req.body.verifiers;
    mandate.authoriser = req.body.authoriser ?? mandate.authoriser
    mandate.numberOfverifier = req.body.verifiers?.length ?? mandate.numberOfverifier

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
  const { perPage, page } = req.query;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { _id: -1 },
  };

  try {
    const mine = await User.findById(req.user._id)
    const organizationId = mine.organizationId.toString();
    const mandates = await Mandate.aggregate([
      {
        $match: {
          organizationId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "verifiers",
          foreignField: "_id",
          as: "verifiers",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "authoriser",
          foreignField: "_id",
          as: "authoriser",
        },
      },
      {
        $unwind: "$authoriser",
      },
      {
        $facet: {
          data: [
            {
              $sort: { ...options.sort },
            },
            {
              $skip: options.limit * (options.page - 1),
            },
            {
              $limit: options.limit * 1,
            },
          ],
          meta: [
            {
              $count: "total",
            },
            {
              $addFields: {
                page: options.page,
                perPage: options.limit,
              },
            },
          ],
        },
      },
    ]);

    // const mandate = await Mandate.find().populate(["authorisers"]);
    return res.status(200).json({
      message: "Request Successful",
      data: {
        mandates: mandates[0].data,
        meta: mandates[0].meta[0],
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const getSingleMandate = async (req, res) => {
  const id = req.params.id;
  try {
    const mandate = await Mandate.findById(id.toString()).populate([
      {
        path: "authoriser",
        select: "firstName lastName",
      },
      {
        path: "verifiers",
        select: "firstName lastName"
      }
    ])

    return res.status(200).json({
      message: "Request Successful",
      mandate,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};


const deleteMandate = async(req, res) =>{
  try{
    const checkMandate = await Mandate.findOne({_id:req.params.mandateId})
    if(!checkMandate){
      return res.status(400).send({
        success: false,
        message:'can\'t find this madate'
      })
    }

    const deleteMandate = await Mandate.deleteOne({_id:req.params.mandateId})
    if(deleteMandate.deletedCount > 0){
      return res.status(200).send({
        success: true,
        message: 'mandate deleted'
      })
    }
    return res.status(500).send({
      success: false,
      message: 'Error deleting mandate'
    })

  }catch(error){
    console.log(error)
    return res.status(500).send({
      message: error.message
    })
  }
}

module.exports = {
  registerMandate,
  updateMandate,
  getAllMandates,
  getSingleMandate,
  deleteMandate
};

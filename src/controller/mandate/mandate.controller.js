const Mandate = require("../../model/mandate.model");
const { validateUpdateMandateSchema } = require("../../utils/utils");
const { PER_PAGE } = require("../../utils/constants");
const User = require("../../model/user.model");
const Joi = require("joi");
const InitiateRequest = require("../../model/initiateRequest.model")
const Privilege = require("../../model/privilege.model")

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

      if (req.body.minAmount !== 0) {
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

      mandate.numberOfVerifiers = mandate.verifiers.length;

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
    const { mandateId } = req.params;
    const { name, verifiers, authoriser } = req.body;

    const existingMandate = await Mandate.findById(mandateId);

    if (!existingMandate) {
      return res.status(400).json({ message: "This mandate doesn't exist" });
    }

    // Update name if provided
    if (name && name !== existingMandate.name) {
      const mandateWithSameName = await Mandate.findOne({ name });

      if (mandateWithSameName && mandateWithSameName._id.toString() !== mandateId) {
        return res.status(400).json({ message: "Mandate name already exists" });
      }

      existingMandate.name = name;
    }

    if(verifiers){
      if(verifiers.length < 1){
        return res.status(400).json({ message: "Please select at least one verifier" });
      }
      existingMandate.verifiers = verifiers;
      existingMandate.numberOfVerifiers = existingMandate.verifiers.length;
    }

    if(authoriser){
      existingMandate.authoriser = authoriser;
    }

    const result = await existingMandate.save();

    return res.status(200).json({
      status: "success",
      message: "Mandate updated successfully",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};



const getAllMandates = async (req, res) => {
  const { perPage, page, name } = req.query;

  const options = {
    page: page || 1,
    limit: perPage || PER_PAGE,
    sort: { _id: -1 },
  };

  try {
    const mine = await User.findById(req.user._id);
    const userOrganizationId = mine.organizationId.toString();
    const paramsOrganizationId = req.query.organizationId;

    const organizationId = paramsOrganizationId || userOrganizationId;

    const filter = { organizationId };
    if (name) {
      filter.name = { $regex: name, $options: "i" }; // Case-insensitive regex matching mandate name
    }

    const totalMandates = await Mandate.countDocuments(filter);

    const mandates = await Mandate.find(filter)
      .sort(options.sort)
      .skip(options.limit * (options.page - 1))
      .limit(options.limit)
      .populate("authoriser")
      .populate("verifiers");

    return res.status(200).json({
      message: "Request Successful",
      data: {
        mandates,
        meta: {
          total: totalMandates,
          page: options.page,
          perPage: options.limit,
        },
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


const deleteMandate = async (req, res) => {
  try {
    const checkMandate = await Mandate.findOne({ _id: req.params.mandateId })
    if (!checkMandate) {
      return res.status(400).send({
        success: false,
        message: 'can\'t find this madate'
      })
    }
    //check if mandate is tied to a transfer request
    const checkTransfer = await InitiateRequest.find({ mandate: req.params.mandateId })

    if (checkTransfer.length > 0) {
      return res.status(400).send({
        success: false,
        message: 'can\'t delete this mandate, this mandate is tied to one or more transfers'
      })
    }

    const deleteMandate = await Mandate.deleteOne({ _id: req.params.mandateId })
    if (deleteMandate.deletedCount > 0) {
      return res.status(200).send({
        success: true,
        message: 'mandate deleted'
      })
    }
    return res.status(500).send({
      success: false,
      message: 'Error deleting mandate'
    })

  } catch (error) {
    console.log(error)
    return res.status(500).send({
      message: error.message
    })
  }
}

const updateMandateAuthorizerVerifiers = async (req, res) => {
  try {
    // Check the privilege of the incoming user
    const checkIncomingUser = await User.findOne({ _id: req.body.incomingUser });
    const checkOutgoingUser  = await User.findOne({ _id: req.body.outgoingUser })

    if (!checkIncomingUser || !checkOutgoingUser) {
      return res.status(400).send({
        success: false,
        message: 'User not found or has been'
      });
    }

    if(checkIncomingUser.disabled === true){
      return res.status(400).send({
        success: false,
        message: 'This user is disabled from this system at the moment'
      });
    }

    if (checkIncomingUser.organizationId.toString() !== checkOutgoingUser.organizationId.toString()) {
      return res.status(400).send({
        success: false,
        message: 'This user is not in the same organization as the outgoing user'
      });
    }

    if (req.body.incomingUser === req.body.outgoingUser) {
      return res.status(400).send({
        success: false,
        message: 'The incoming user cannot be the same as the outgoing user'
      });
    }

    switch (req.body.type) {
      case 'authoriser':
        const getPrivilegeId = await Privilege.findOne({ name: 'authoriser' });

        if (checkIncomingUser.privileges[0].toString() !== getPrivilegeId._id.toString()) {
          return res.status(400).send({
            success: false,
            message: 'This user does not have the privilege of an authoriser'
          });
        }

        // Update all mandates with the incoming user as the authorizer
        const updateMandateAuthorizer = await Mandate.updateMany(
          { organizationId: checkIncomingUser.organizationId, authoriser: req.body.outgoingUser },
          { $set: { authoriser: req.body.incomingUser } }
        );

        if (updateMandateAuthorizer.matchedCount < 1) {
          return res.status(500).send({
            success: false,
            message: 'There was an error updating the mandate'
          });
        }

        return res.status(200).send({
          success: true,
          message: 'Authoriser updated successfully'
        });

      case 'verifier':
        // TODO: Implement the verifier logic here
        const getVerifierPrivilegeId = await Privilege.findOne({ name: 'verifier' });
        if (checkIncomingUser.privileges[0].toString() !== getVerifierPrivilegeId._id.toString()) {
          return res.status(400).send({
            success: false,
            message: 'This user does not have the privilege of a verifier'
          });
        }

        // Update all mandates with the incoming user as the authorizer
        const PullMandateVerifier = await Mandate.updateMany(
          {
            organizationId: checkIncomingUser.organizationId,
            verifiers: { $in: [req.body.outgoingUser] }
          },
          {
            $pull: { verifiers: req.body.outgoingUser }
          }
        );
        console.log("🚀 ~ file: mandate.controller.js:329 ~ updateMandateAuthorizerVerifiers ~ PullMandateVerifier:", PullMandateVerifier)
        if (PullMandateVerifier.modifiedCount > 0) {

          const addUser = await Mandate.updateMany({
            organizationId: checkIncomingUser.organizationId,
          },

            {
              $addToSet: { verifiers: req.body.incomingUser }
            }
          )
          if (addUser.matchedCount < 1) {
            return res.status(500).send({
              success: false,
              message: 'There was an error updating the mandate'
            });
          }

          return res.status(200).send({
            success: true,
            message: 'verifier updated successfully'
          });
        }
        res.status(500).send({
          success: true,
          message: 'Error update this verifier'
        });
        break;

      default:
        return res.status(400).send({
          success: false,
          message: 'This user is not authorized to be part of a mandate'
        });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: error.message
    });
  }
};


module.exports = {
  registerMandate,
  updateMandate,
  getAllMandates,
  getSingleMandate,
  deleteMandate,
  updateMandateAuthorizerVerifiers
};

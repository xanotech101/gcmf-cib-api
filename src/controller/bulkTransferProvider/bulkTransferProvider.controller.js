const {bulkTransferProviderService} = require("../../services");

const createProvider = async (req, res) => {
  try {
    const { name } = req.body;
    const newProvider = await bulkTransferProviderService.createProvider({ name });
    res.status(201).json({ message: "Provider created successfully", data: newProvider });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

const getProviders = async (_req, res) => {
  try {
    const providers = await bulkTransferProviderService.getProviders();
    res.status(200).json({ message: "Providers fetched successfully", data: providers });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}
const toggleProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const updatedProvider = await bulkTransferProviderService.toggleProvider(providerId);
    res.status(200).json({ message: "Provider toggled successfully", data: updatedProvider });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProvider,
  getProviders,
  toggleProvider
};

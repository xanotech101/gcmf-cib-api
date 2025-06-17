const bcrypt = require('bcrypt');
const BulkTransferProvider = require('../model/bulkTransferProviders.model');

class BulkTransferProviderService {
    async createProvider(name) {
        const provider = new BulkTransferProvider({ name });
        await provider.save();
        return provider;
    } 

    async getAllProviders() {
        return await BulkTransferProvider.find();
    }

    async toggleProvider(id) {
        const provider = await BulkTransferProvider.findById(id);
        if (provider) {
            provider.isActive = !provider.isActive;
            await provider.save();
            return provider;
        }
        throw new Error('Provider not found');
    }
}

module.exports = new BulkTransferProviderService();
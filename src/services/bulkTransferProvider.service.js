const BulkTransferProvider = require('../model/bulkTransferProviders.model');

class BulkTransferProviderService {
    async createProvider(name) {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const provider = new BulkTransferProvider({ name, slug });
        await provider.save();
        return provider;
    } 

    async getProviders() {
        return await BulkTransferProvider.find();
    }

    async toggleProviderStatus(id) {
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
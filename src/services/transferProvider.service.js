const TransferProvider = require('../model/transferProviders.model');

class TransferProviderService {
    async createProvider(name) {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const provider = new TransferProvider({ name, slug });
        await provider.save();
        return provider;
    } 

    async getProviders() {
        return await TransferProvider.find();
    }

    async toggleProviderStatus(id) {
        const provider = await TransferProvider.findById(id);
        if (provider) {
            provider.isActive = !provider.isActive;
            await provider.save();
            return provider;
        }
        throw new Error('Provider not found');
    }

    async getActiveProviders() {
        return await TransferProvider.findOne({ isActive: true });
    }
}

module.exports = new TransferProviderService();
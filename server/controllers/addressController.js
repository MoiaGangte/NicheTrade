import Address from "../models/Address.js";

// add address : /api/address/add
export const addAddress = async (req, res) => {
    try {
        const { address, userId } = req.body;
        await Address.create({ userId, ...address })
        res.json({ success: true, message: "Address added successfully" })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });

    }
}

// get address : /api/address/get
export const getAddress = async (req, res) => {
    try {
        const addresses = await Address.find({ userId: req.userId })
        res.json({ success: true, addresses})
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// delete address : /api/address/:id
export const deleteAddress = async (req, res) => {
    try {
        await Address.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

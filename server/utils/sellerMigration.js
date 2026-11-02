import Seller from "../models/Seller.js";
import Product from "../models/Product.js";
export const migrateSellerStatuses = async () => {
    const sellers = await Seller.find({}).select("_id status isApproved isActive").lean();
    for (const seller of sellers) {
        const status = ["active", "suspended", "banned"].includes(seller.status)
            ? seller.status
            :             seller.isActive === false && seller.isApproved === false
                ? "suspended"
                : seller.isActive === false
                    ? "suspended"
                    : "active";

        await Seller.updateOne(
            { _id: seller._id },
            {
                $set: {
                    status,
                    isApproved: true,
                    isActive: status === "active",
                },
                ...(status === "active" ? { $unset: { statusReason: "" } } : {}),
            },
        );
        if (status !== "active") {
            const sellerId = seller._id;
            const snapshotsExist = await Seller.exists({ _id: sellerId, "hiddenProductVisibility.0": { $exists: true } });
            if (!snapshotsExist) {
                const products = await Product.find({ sellerId }).select("_id isVisible");
                if (products.length) {
                    await Seller.updateOne(
                        { _id: sellerId },
                        { $set: { hiddenProductVisibility: products.map((product) => ({
                            productId: product._id,
                            wasVisible: product.isVisible !== false,
                        })) } },
                    );
                }
            }
            await Product.updateMany({ sellerId }, { $set: { isVisible: false } });
        }
    }
    console.log(`[Seller migration] Checked ${sellers.length} seller account(s).`);
};

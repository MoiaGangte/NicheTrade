export const getProductCategories = (product) => {
    if (Array.isArray(product?.categories) && product.categories.length > 0) {
        return product.categories;
    }
    return product?.category ? [product.category] : [];
};

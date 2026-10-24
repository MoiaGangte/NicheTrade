const hiddenProductCategories = new Set([
    'organic vegetable',
    'organic vegetables',
    'household',
    'shoes',
    'drink',
    'drinks',
    'shirt',
    'shirts',
    'fashion',
    'fasion',
]);

export const isVisibleProductCategory = (category) =>
    typeof category === 'string' && !hiddenProductCategories.has(category.trim().toLocaleLowerCase());

export const filterVisibleProductCategories = (categories) =>
    [...new Set((categories || []).filter(isVisibleProductCategory))];

export const getProductCategories = (product) => {
    if (Array.isArray(product?.categories) && product.categories.length > 0) {
        return product.categories;
    }
    return product?.category ? [product.category] : [];
};

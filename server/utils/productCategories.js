export const normalizeProductCategories = (value) => {
    const input = Array.isArray(value) ? value : [value];
    const categories = [];
    const seen = new Set();

    for (const category of input) {
        if (typeof category !== "string" || !category.trim()) {
            continue;
        }
        const normalized = category.trim();
        const key = normalized.toLocaleLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            categories.push(normalized);
        }
    }

    if (categories.length === 0) {
        const error = new Error("Choose at least one product category");
        error.status = 400;
        throw error;
    }

    return categories;
};

export const normalizeListingQuantity = (value) => {
    const quantity = Number(value);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
        const error = new Error("Listing quantity must be a positive whole number");
        error.status = 400;
        throw error;
    }
    return quantity;
};

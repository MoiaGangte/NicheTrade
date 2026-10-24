import React, { useState, useEffect } from "react";
import { assets } from "../../assets/assets";
import { categories as defaultCategories } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { filterVisibleProductCategories } from "../../utils/productCategories";

const AddProduct = () => {
    const { axios } = useAppContext();
    const navigate = useNavigate();
    const [files, setfiles] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [offerPrice, setOfferPrice] = useState("");
    const [stockQuantity, setStockQuantity] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [newCategory, setNewCategory] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customCategories, setCustomCategories] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('/api/product/categories');
                if (data.success) {
                    setAvailableCategories(filterVisibleProductCategories(data.categories));
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, [axios]);

    const refetchCategories = async () => {
        try {
            const { data } = await axios.get('/api/product/categories');
            if (data.success) {
                setAvailableCategories(filterVisibleProductCategories(data.categories));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Merge default, API, and custom categories for shortcuts
    const allCategoryShortcuts = [
        ...defaultCategories.map(cat => ({ text: cat.text, value: cat.path, isDefault: true, canDelete: false })),
        ...availableCategories
            .filter(cat => !defaultCategories.some(dc => dc.path.toLocaleLowerCase() === cat.toLocaleLowerCase()))
            .map(cat => ({ text: cat, value: cat, isDefault: false, canDelete: true })),
        ...customCategories
            .filter(cat => !availableCategories.some(item => item.toLocaleLowerCase() === cat.toLocaleLowerCase()))
            .filter(cat => !defaultCategories.some(item => item.path.toLocaleLowerCase() === cat.toLocaleLowerCase()))
            .map(cat => ({ text: cat, value: cat, isDefault: false, canDelete: true }))
    ];

    const handleCategoryShortcut = (catValue) => {
        setSelectedCategories((current) => current.some((category) => category.toLocaleLowerCase() === catValue.toLocaleLowerCase())
            ? current.filter((category) => category.toLocaleLowerCase() !== catValue.toLocaleLowerCase())
            : [...current, catValue]);
    };

    const addCustomCategory = () => {
        const category = newCategory.trim();
        if (!category) return;

        const existing = [
            ...defaultCategories.map((item) => item.path),
            ...availableCategories,
            ...customCategories,
        ]
            .find((item) => item.toLocaleLowerCase() === category.toLocaleLowerCase());
        const normalized = existing || category;
        if (!defaultCategories.some((item) => item.path.toLocaleLowerCase() === normalized.toLocaleLowerCase())
            && !availableCategories.includes(normalized)
            && !customCategories.includes(normalized)) {
            setCustomCategories((current) => [...current, normalized]);
        }
        setSelectedCategories((current) => current.some((item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase())
            ? current
            : [...current, normalized]);
        setNewCategory("");
    };

    const handleRemoveShortcut = async (catValue) => {
        // If it's a category from the API (not default), delete it from database
        if (availableCategories.includes(catValue) && !defaultCategories.some(dc => dc.path === catValue)) {
            try {
                const { data } = await axios.delete('/api/product/category', { data: { category: catValue } });
                if (data.success) {
                    toast.success(data.message);
                    // Remove from available categories
                    setAvailableCategories(prev => prev.filter(c => c !== catValue));
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                toast.error('Failed to delete category');
            }
        } else {
            // It's a custom category, just remove from local state
            setCustomCategories(prev => prev.filter(c => c !== catValue));
        }
        setSelectedCategories((current) => current.filter((category) => category.toLocaleLowerCase() !== catValue.toLocaleLowerCase()));
    };

    const submitListing = async (productData, listingFiles) => {
        const formData = new FormData();
        formData.append('productData', JSON.stringify(productData));
        listingFiles.forEach((file) => formData.append('images', file));

        const { data } = await axios.post('/api/product/add', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (!data.success) {
            throw new Error(data.message || "Failed to add product");
        }

        toast.success('Product added successfully! Redirecting to product list...', {
            duration: 3000,
            position: 'top-center',
            style: {
                background: '#4CAF50',
                color: '#fff',
                fontSize: '16px',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            },
        });
        await refetchCategories();
        setTimeout(() => navigate("/seller/product-list", { replace: true }), 2000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const quantity = Number(stockQuantity);
        if (!name || !description || !price || !Number.isSafeInteger(quantity) || quantity < 1) {
            toast.error("Please fill in all required fields");
            return;
        }
        if (selectedCategories.length === 0) {
            toast.error("Choose at least one product category");
            return;
        }
        if (files.filter(Boolean).length === 0) {
            toast.error("Please upload at least one product image");
            return;
        }
        setIsSubmitting(true);
        try {
            const productData = {
                name,
                description: description.split('\n'),
                categories: selectedCategories,
                price: Number(price),
                offerPrice: Number(offerPrice) || 0,
                stockQuantity: quantity
            };
            const listingFiles = files.filter(Boolean);

            await submitListing(productData, listingFiles);
        } catch (error) {
            setIsSubmitting(false);
            toast.error(error.response?.data?.message || error.message || "Unable to publish listing");
        }
    };

    return (
        <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
            <h1 className="text-3xl font-semibold mb-2">Add New Product</h1>
            <p className="px-4 text-sm text-gray-600">
                Publishing a listing is free. Arrange any sale payment directly with the buyer.
            </p>
            <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
                <div>
                    <p className="text-base font-medium">Product Image <span className="text-red-500">*</span></p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        {Array(4).fill('').map((_, index) => (
                            <label key={index} htmlFor={`image${index}`}>
                                <input 
                                    onChange={(e) => {
                                        const updatedFiles = [...files];
                                        updatedFiles[index] = e.target.files[0];
                                        setfiles(updatedFiles);
                                    }} 
                                    accept="image/*" 
                                    type="file" 
                                    id={`image${index}`} 
                                    hidden 
                                />
                                <img 
                                    className="max-w-24 cursor-pointer" 
                                    src={files[index] ? URL.createObjectURL(files[index]) : assets.upload_area} 
                                    alt="uploadArea" 
                                    width={100} 
                                    height={100} 
                                />
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label className="text-base font-medium" htmlFor="product-name">Product Name <span className="text-red-500">*</span></label>
                    <input 
                        onChange={(e) => setName(e.target.value)} 
                        value={name} 
                        id="product-name" 
                        type="text" 
                        placeholder="Type here" 
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" 
                        required 
                    />
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label className="text-base font-medium" htmlFor="product-description">Product Description <span className="text-red-500">*</span></label>
                    <textarea 
                        onChange={(e) => setDescription(e.target.value)} 
                        value={description} 
                        id="product-description" 
                        rows={4} 
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none" 
                        placeholder="Type here"
                        required
                    ></textarea>
                </div>
                <div className="flex items-center gap-5 flex-wrap">
                    <div className="flex-1 flex flex-col gap-1 w-32">
                        <label className="text-base font-medium" htmlFor="product-price">Product Price <span className="text-red-500">*</span></label>
                        <input 
                            onChange={(e) => setPrice(e.target.value)} 
                            value={price} 
                            id="product-price" 
                            type="number" 
                            placeholder="0" 
                            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" 
                            required 
                        />
                        </div>
                    <div className="flex-1 flex flex-col gap-1 w-32">
                        <label className="text-base font-medium" htmlFor="offer-price">Offer Price</label>
                        <input 
                            onChange={(e) => setOfferPrice(e.target.value)} 
                            value={offerPrice} 
                            id="offer-price" 
                            type="number" 
                            placeholder="0" 
                            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" 
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label className="text-base font-medium" htmlFor="stock-quantity">Stock Quantity <span className="text-red-500">*</span></label>
                    <input 
                        onChange={(e) => setStockQuantity(e.target.value)} 
                        value={stockQuantity} 
                        id="stock-quantity" 
                        type="number" 
                        min="1"
                        step="1"
                        placeholder="Enter quantity" 
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" 
                        required 
                    />
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                    <label className="text-base font-medium" htmlFor="product-category">Category <span className="text-red-500">*</span></label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {allCategoryShortcuts.map((cat) => (
                            <div key={cat.value} className="flex items-center gap-1">
                                <button
                                    type="button"
                                    aria-pressed={selectedCategories.some((category) => category.toLocaleLowerCase() === cat.value.toLocaleLowerCase())}
                                    className={`px-3 py-1 rounded border border-gray-400 hover:bg-[var(--color-primary)] hover:text-white transition text-sm ${selectedCategories.some((category) => category.toLocaleLowerCase() === cat.value.toLocaleLowerCase()) ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100'}`}
                                    onClick={() => handleCategoryShortcut(cat.value)}
                                >
                                    {cat.text}{cat.text !== cat.value ? ` (${cat.value})` : ''}
                                </button>
                                {cat.canDelete && (
                                    <button
                                        type="button"
                                        className="text-red-500 text-xs px-1 hover:bg-red-100 rounded"
                                        title="Delete this category"
                                        onClick={() => handleRemoveShortcut(cat.value)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                    <input
                        onChange={(event) => setNewCategory(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                addCustomCategory();
                            }
                        }}
                        value={newCategory}
                        id="product-category" 
                        type="text" 
                        placeholder="Enter another category"
                        className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40" 
                    />
                    <button type="button" onClick={addCustomCategory} className="rounded bg-gray-200 px-3 py-2 font-medium hover:bg-gray-300">
                        Add
                    </button>
                    </div>
                    <p className="text-sm text-gray-600">
                        {selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"} selected
                    </p>
                    {selectedCategories.length > 0 && (
                        <p className="text-xs text-gray-500">Selected: {selectedCategories.join(", ")}</p>
                    )}
                </div>
                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-8 py-2.5 bg-indigo-500 text-white font-medium rounded ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600'}`}
                >
                    {isSubmitting ? 'Publishing...' : 'Publish listing'}
                </button>
            </form>
        </div>
    );
};

export default AddProduct;
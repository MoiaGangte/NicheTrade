import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingStock, setEditingStock] = useState({});
    const { axios } = useAppContext();

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get('/api/product/seller/list');
            
            if (!data.success) {
                throw new Error(data.message || "Failed to fetch products");
            }

            if (!Array.isArray(data.products)) {
                throw new Error("Invalid products data received");
            }

            setProducts(data.products);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            toast.error(error.response?.data?.message || error.message || "Failed to fetch products");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStockStatus = async (productId, currentStatus) => {
        if (!productId) {
            toast.error("Invalid product ID");
            return;
        }

        try {
            const { data } = await axios.post('/api/product/stock', {
                id: productId,
                inStock: !currentStatus,
                isVisible: !currentStatus
            });
            
            if (data.success) {
                toast.success(currentStatus ? "Product is now out of stock" : "Product is now in stock");
                await fetchProducts();
            } else {
                throw new Error(data.message || "Failed to update stock status");
            }
        } catch (error) {
            console.error('Error updating stock status:', error);
            toast.error(error.response?.data?.message || error.message || "Failed to update stock status");
        }
    };

    const updateStockQuantity = async (productId, newQuantity) => {
        if (!productId) {
            toast.error("Invalid product ID");
            return;
        }

        if (newQuantity < 0) {
            toast.error("Stock quantity cannot be negative");
            return;
        }

        try {
            const { data } = await axios.post('/api/product/stock', {
                id: productId,
                stockQuantity: parseInt(newQuantity),
                inStock: newQuantity > 0
            });
            
            if (data.success) {
                const quantity = parseInt(newQuantity);
                if (quantity > 0) {
                    toast.success(`Stock quantity updated to ${quantity}. Product is now in stock.`);
                } else {
                    toast.success(`Stock quantity updated to ${quantity}. Product is now out of stock.`);
                }
                setEditingStock(prev => ({ ...prev, [productId]: false }));
                await fetchProducts();
            } else {
                throw new Error(data.message || "Failed to update stock quantity");
            }
        } catch (error) {
            console.error('Error updating stock quantity:', error);
            toast.error(error.response?.data?.message || error.message || "Failed to update stock quantity");
        }
    };

    const handleStockInputChange = (productId, value) => {
        setEditingStock(prev => ({ ...prev, [productId]: value }));
    };

    const handleStockInputBlur = (productId, currentValue) => {
        const product = products.find(p => p._id === productId);
        if (product && product.stockQuantity !== parseInt(currentValue)) {
            updateStockQuantity(productId, currentValue);
        } else {
            setEditingStock(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handleStockInputKeyPress = (e, productId, currentValue) => {
        if (e.key === 'Enter') {
            e.target.blur();
        } else if (e.key === 'Escape') {
            setEditingStock(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handleDelete = async (productId) => {
        if (!productId) {
            toast.error("Invalid product ID");
            return;
        }

        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const { data } = await axios.delete(`/api/product/delete/${productId}`);
            
            if (data.success) {
                toast.success("Product deleted successfully");
                await fetchProducts();
            } else {
                throw new Error(data.message || "Failed to delete product");
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error(error.response?.data?.message || error.message || "Failed to delete product");
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[95vh]">
                <div className="text-lg">Loading products...</div>
            </div>
        );
    }

    return (
        <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll">
            <div className="md:p-10 p-4">
                <h2 className="text-2xl font-bold mb-5">Product List</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 text-left">Image</th>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Price</th>
                                <th className="p-3 text-left">Stock Status</th>
                                <th className="p-3 text-left">Stock Quantity</th>
                                <th className="p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product._id} className="border-b">
                                        <td className="p-3">
                                            <img 
                                                src={product.image?.[0] || ''} 
                                                alt={product.name || 'Product'} 
                                                className="w-16 h-16 object-cover rounded"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/64';
                                                }}
                                            />
                                        </td>
                                        <td className="p-3">{product.name || 'N/A'}</td>
                                        <td className="p-3">${product.offerPrice || 0}</td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => toggleStockStatus(product._id, product.inStock)}
                                                className={`px-4 py-2 rounded ${
                                                    product.inStock ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                }`}
                                            >
                                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                                            </button>
                                        </td>
                                        <td className="p-3">
                                            {editingStock[product._id] !== false ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editingStock[product._id] || product.stockQuantity || 0}
                                                    onChange={(e) => handleStockInputChange(product._id, e.target.value)}
                                                    onBlur={(e) => handleStockInputBlur(product._id, e.target.value)}
                                                    onKeyDown={(e) => handleStockInputKeyPress(e, product._id, e.target.value)}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div 
                                                    className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                                    onClick={() => setEditingStock(prev => ({ ...prev, [product._id]: product.stockQuantity || 0 }))}
                                                    title="Click to edit stock quantity"
                                                >
                                                    <span className={`font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {product.stockQuantity || 0}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-1">(click to edit)</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-3 text-center text-gray-500">
                                        No products found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductList;
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const inputClass = "w-full rounded border border-gray-300 p-2 outline-[var(--color-primary)]";

const AdminDashboard = ({ section }) => {
    const { axios } = useAppContext();
    const [sellers, setSellers] = useState([]);
    const [products, setProducts] = useState([]);
    const [lostFoundPosts, setLostFoundPosts] = useState([]);
    const [requestItems, setRequestItems] = useState([]);
    const [sellerUploadRequests, setSellerUploadRequests] = useState([]);
    const [sellerStatus, setSellerStatus] = useState("pending");
    const [grantCounts, setGrantCounts] = useState({});
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingSellerId, setUpdatingSellerId] = useState(null);
    const [deletingItemId, setDeletingItemId] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (section === "sellers") {
                const { data } = await axios.get(`/api/admin/sellers?status=${sellerStatus}`);
                if (!data.success) throw new Error(data.message || "Unable to load seller applications");
                setSellers(data.sellers);
            } else if (section === "upload-requests") {
                const { data } = await axios.get("/api/admin/seller-upload-requests");
                if (!data.success) throw new Error(data.message || "Unable to load seller upload requests");
                setSellerUploadRequests(data.requests);
            } else if (section === "products") {
                const { data } = await axios.get("/api/admin/products");
                if (!data.success) throw new Error(data.message || "Unable to load products");
                setProducts(data.products);
            } else if (section === "lost-found") {
                const { data } = await axios.get("/api/admin/lost-found");
                if (!data.success) throw new Error(data.message || "Unable to load lost and found posts");
                setLostFoundPosts(data.posts);
            } else {
                const { data } = await axios.get("/api/admin/request-items");
                if (!data.success) throw new Error(data.message || "Unable to load item requests");
                setRequestItems(data.requests);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to load admin data");
        } finally {
            setLoading(false);
        }
    }, [axios, section, sellerStatus]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const approveSeller = async (sellerId) => {
        try {
            const { data } = await axios.patch(`/api/admin/sellers/${sellerId}/approve`);
            if (!data.success) throw new Error(data.message || "Unable to approve seller");
            toast.success(`${data.seller.name} approved`);
            await fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to approve seller");
        }
    };

    const setSellerActiveStatus = async (seller, isActive) => {
        setUpdatingSellerId(seller._id);
        try {
            const { data } = await axios.patch(`/api/admin/sellers/${seller._id}/status`, { isActive });
            if (!data.success) throw new Error(data.message || "Unable to update seller status");
            toast.success(`${seller.name} ${isActive ? "enabled" : "disabled"}`);
            await fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to update seller status");
        } finally {
            setUpdatingSellerId(null);
        }
    };

    const setSellerVipStatus = async (seller, isVip) => {
        setUpdatingSellerId(seller._id);
        try {
            const { data } = await axios.patch(`/api/admin/sellers/${seller._id}/upload-benefits`, { isVip });
            if (!data.success) throw new Error(data.message || "Unable to update VIP status");
            toast.success(isVip ? `${seller.name} is now VIP` : `${seller.name}'s VIP status was disabled`);
            await fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to update VIP status");
        } finally {
            setUpdatingSellerId(null);
        }
    };

    const decideUploadRequest = async (request, decision) => {
        const freeUploads = Number(grantCounts[request._id]);
        if (decision === "credits" && (!Number.isSafeInteger(freeUploads) || freeUploads < 1)) {
            toast.error("Enter a number of at least one free upload");
            return;
        }
        setUpdatingSellerId(request._id);
        try {
            const { data } = await axios.patch(`/api/admin/seller-upload-requests/${request._id}`, {
                decision,
                ...(decision === "credits" ? { freeUploads } : {}),
            });
            if (!data.success) throw new Error(data.message || "Unable to process upload request");
            toast.success(data.message);
            await fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to process upload request");
        } finally {
            setUpdatingSellerId(null);
        }
    };

    const deleteSeller = async (seller) => {
        const confirmed = window.confirm(
            `Permanently delete ${seller.name}'s seller account and all of their product listings? This cannot be undone.`
        );
        if (!confirmed) return;

        setUpdatingSellerId(seller._id);
        try {
            const { data } = await axios.delete(`/api/admin/sellers/${seller._id}`);
            if (!data.success) throw new Error(data.message || "Unable to delete seller");
            toast.success(data.message);
            await fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to delete seller");
        } finally {
            setUpdatingSellerId(null);
        }
    };

    const openProductEditor = (product) => {
        setEditingProduct({
            ...product,
            description: Array.isArray(product.description) ? product.description.join("\n") : product.description || "",
            image: Array.isArray(product.image) ? product.image.join("\n") : "",
        });
    };

    const saveProduct = async (event) => {
        event.preventDefault();
        if (!editingProduct || saving) return;
        setSaving(true);
        try {
            const payload = {
                name: editingProduct.name,
                category: editingProduct.category,
                price: editingProduct.price,
                offerPrice: editingProduct.offerPrice,
                description: editingProduct.description,
                image: editingProduct.image.split("\n").map((url) => url.trim()).filter(Boolean),
                stockQuantity: editingProduct.stockQuantity,
                isVisible: editingProduct.isVisible,
                isBestSeller: editingProduct.isBestSeller,
            };
            const { data } = await axios.patch(`/api/admin/products/${editingProduct._id}`, payload);
            if (!data.success) throw new Error(data.message || "Unable to save product");
            toast.success("Product updated");
            setEditingProduct(null);
            await fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to save product");
        } finally {
            setSaving(false);
        }
    };

    const deleteProduct = async (productId) => {
        if (!window.confirm("Delete this product permanently?")) return;
        try {
            const { data } = await axios.delete(`/api/admin/products/${productId}`);
            if (!data.success) throw new Error(data.message || "Unable to delete product");
            toast.success("Product deleted");
            await fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to delete product");
        }
    };

    const deleteLostFoundPost = async (post) => {
        if (!window.confirm(`Permanently delete the ${post.postType} item "${post.itemName}"?`)) return;
        setDeletingItemId(post._id);
        try {
            const { data } = await axios.delete(`/api/admin/lost-found/${post._id}`);
            if (!data.success) throw new Error(data.message || "Unable to delete lost and found post");
            toast.success(data.message || "Lost and found post deleted");
            setLostFoundPosts((currentPosts) => currentPosts.filter((item) => item._id !== post._id));
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to delete lost and found post");
        } finally {
            setDeletingItemId(null);
        }
    };

    const deleteRequestItem = async (request) => {
        if (!window.confirm(`Permanently delete the item request "${request.itemName}"?`)) return;
        setDeletingItemId(request._id);
        try {
            const { data } = await axios.delete(`/api/admin/request-items/${request._id}`);
            if (!data.success) throw new Error(data.message || "Unable to delete item request");
            toast.success(data.message || "Item request deleted");
            setRequestItems((currentRequests) => currentRequests.filter((item) => item._id !== request._id));
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Unable to delete item request");
        } finally {
            setDeletingItemId(null);
        }
    };

    if (loading) {
        return <div className="flex min-h-[60vh] items-center justify-center">Loading...</div>;
    }

    if (section === "sellers") {
        return (
            <main className="p-4 md:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Seller Accounts</h1>
                        <p className="mt-1 text-sm text-gray-500">Approve applications or disable access for approved sellers.</p>
                    </div>
                    <select
                        value={sellerStatus}
                        onChange={(event) => setSellerStatus(event.target.value)}
                        className="rounded border border-gray-300 bg-white p-2"
                        aria-label="Filter seller accounts"
                    >
                        <option value="pending">Pending approval</option>
                        <option value="approved">Approved sellers</option>
                        <option value="disabled">Disabled sellers</option>
                    </select>
                </div>
                {sellers.length === 0 ? (
                    <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">No {sellerStatus} seller accounts.</p>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {sellers.map((seller) => (
                            <article key={seller._id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-semibold text-gray-900">{seller.name}</h2>
                                        <p className="text-sm text-gray-600">{seller.email}</p>
                                        <p className="text-sm text-gray-600">{seller.phone}</p>
                                        <p className="text-sm text-gray-600">Department: {seller.department || "Not provided"}</p>
                                        <p className="text-sm text-gray-600">Store: {seller.storeName || "Not provided"}</p>
                                        <p className="text-sm text-gray-600">Address: {seller.address || "Not provided"}</p>
                                        <p className="text-sm text-gray-600">GST: {seller.gstNumber || "Not provided"}</p>
                                        <p className="mt-2 text-xs text-gray-400">
                                            Registered {new Date(seller.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {sellerStatus === "pending" && (
                                        <button
                                            type="button"
                                            onClick={() => approveSeller(seller._id)}
                                            className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90"
                                        >
                                            Approve seller
                                        </button>
                                    )}
                                    {sellerStatus === "approved" && (
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Approved</span>
                                            <span className="text-xs text-gray-600">
                                                {seller.isVip ? "VIP · unlimited free uploads" : `${seller.freeUploads || 0} free upload(s)`}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSellerVipStatus(seller, !seller.isVip)}
                                                disabled={updatingSellerId === seller._id}
                                                className={`rounded-md border px-3 py-2 text-sm disabled:opacity-60 ${seller.isVip ? "border-amber-300 text-amber-800 hover:bg-amber-50" : "border-indigo-300 text-indigo-700 hover:bg-indigo-50"}`}
                                            >
                                                {updatingSellerId === seller._id ? "Updating..." : seller.isVip ? "Disable VIP" : "Make VIP"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSellerActiveStatus(seller, false)}
                                                disabled={updatingSellerId === seller._id}
                                                className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
                                            >
                                                {updatingSellerId === seller._id ? "Updating..." : "Disable seller"}
                                            </button>
                                        </div>
                                    )}
                                    {sellerStatus === "disabled" && (
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">Disabled</span>
                                            <span className="text-xs text-gray-600">
                                                {seller.isVip ? "VIP · unlimited free uploads" : `${seller.freeUploads || 0} free upload(s)`}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSellerVipStatus(seller, !seller.isVip)}
                                                disabled={updatingSellerId === seller._id}
                                                className={`rounded-md border px-3 py-2 text-sm disabled:opacity-60 ${seller.isVip ? "border-amber-300 text-amber-800 hover:bg-amber-50" : "border-indigo-300 text-indigo-700 hover:bg-indigo-50"}`}
                                            >
                                                {updatingSellerId === seller._id ? "Updating..." : seller.isVip ? "Disable VIP" : "Make VIP"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSellerActiveStatus(seller, true)}
                                                disabled={updatingSellerId === seller._id}
                                                className="rounded-md border border-green-300 px-3 py-2 text-sm text-green-700 hover:bg-green-50 disabled:opacity-60"
                                            >
                                                {updatingSellerId === seller._id ? "Updating..." : "Enable seller"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteSeller(seller)}
                                                disabled={updatingSellerId === seller._id}
                                                className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                                            >
                                                {updatingSellerId === seller._id ? "Deleting..." : "Delete seller"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        );
    }

    if (section === "upload-requests") {
        return (
            <main className="p-4 md:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Free Upload Requests</h1>
                    <p className="mt-1 text-sm text-gray-500">Review requests and grant free product uploads or VIP access.</p>
                </div>
                {sellerUploadRequests.length === 0 ? (
                    <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">No pending seller upload requests.</p>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {sellerUploadRequests.map((request) => (
                            <article key={request._id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                                <h2 className="font-semibold text-gray-900">{request.sellerId?.name || "Seller"}</h2>
                                <p className="text-sm text-gray-600">{request.sellerId?.email}</p>
                                <p className="text-sm text-gray-600">Store: {request.sellerId?.storeName || "Not provided"}</p>
                                <p className="mt-1 text-xs text-gray-500">Current balance: {request.sellerId?.isVip ? "VIP" : `${request.sellerId?.freeUploads || 0} free upload(s)`}</p>
                                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{request.description}</p>
                                <p className="mt-2 text-xs text-gray-400">Submitted {new Date(request.createdAt).toLocaleString()}</p>
                                <div className="mt-4 flex flex-wrap items-end gap-2">
                                    <label className="text-sm text-gray-700">
                                        Grant uploads
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={grantCounts[request._id] || ""}
                                            onChange={(event) => setGrantCounts((current) => ({ ...current, [request._id]: event.target.value }))}
                                            className="mt-1 block w-28 rounded border border-gray-300 p-2"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => decideUploadRequest(request, "credits")}
                                        disabled={updatingSellerId === request._id}
                                        className="rounded bg-[var(--color-primary)] px-3 py-2 text-sm text-white disabled:opacity-60"
                                    >
                                        Grant uploads
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => decideUploadRequest(request, "vip")}
                                        disabled={updatingSellerId === request._id}
                                        className="rounded border border-amber-400 px-3 py-2 text-sm text-amber-800 disabled:opacity-60"
                                    >
                                        Make VIP
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => decideUploadRequest(request, "reject")}
                                        disabled={updatingSellerId === request._id}
                                        className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-60"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        );
    }

    if (section === "lost-found") {
        return (
            <main className="p-4 md:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Lost &amp; Found Posts</h1>
                    <p className="mt-1 text-sm text-gray-500">Review and permanently remove lost or found item posts.</p>
                </div>
                {lostFoundPosts.length === 0 ? (
                    <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">No lost and found posts found.</p>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {lostFoundPosts.map((post) => (
                            <article key={post._id} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                {post.image && <img src={post.image} alt="" className="h-24 w-24 shrink-0 rounded object-cover" />}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold text-gray-900">{post.itemName}</h2>
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize text-gray-600">{post.postType}</span>
                                        {post.resolved && <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Resolved</span>}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-600">{post.placeFound || "Location not provided"}</p>
                                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">{post.description}</p>
                                    <p className="mt-2 text-xs text-gray-400">Posted {new Date(post.createdAt).toLocaleDateString()}</p>
                                    <button
                                        type="button"
                                        onClick={() => deleteLostFoundPost(post)}
                                        disabled={deletingItemId === post._id}
                                        className="mt-3 rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                                    >
                                        {deletingItemId === post._id ? "Deleting..." : "Delete post"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        );
    }

    if (section === "request-items") {
        return (
            <main className="p-4 md:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Item Requests</h1>
                    <p className="mt-1 text-sm text-gray-500">Review and permanently remove student item requests.</p>
                </div>
                {requestItems.length === 0 ? (
                    <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">No item requests found.</p>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                        {requestItems.map((request) => (
                            <article key={request._id} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                {request.image && <img src={request.image} alt="" className="h-24 w-24 shrink-0 rounded object-cover" />}
                                <div className="min-w-0 flex-1">
                                    <h2 className="font-semibold text-gray-900">{request.itemName}</h2>
                                    <p className="mt-1 text-sm text-gray-600">Requested by {request.requesterId?.name || "NicheTrade user"}</p>
                                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">{request.description}</p>
                                    <p className="mt-2 text-xs text-gray-400">
                                        Extra payment: {Number(request.promiseAmount || 0).toFixed(2)} · {request.confirmations?.length || 0} offer(s)
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => deleteRequestItem(request)}
                                        disabled={deletingItemId === request._id}
                                        className="mt-3 rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                                    >
                                        {deletingItemId === request._id ? "Deleting..." : "Delete request"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        );
    }

    return (
        <main className="p-4 md:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-semibold">All Products</h1>
                <p className="mt-1 text-sm text-gray-500">Manage products listed by all approved sellers.</p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3">Seller</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Stock</th>
                            <th className="p-3">Visibility</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product._id} className="border-t border-gray-200">
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <img src={product.image?.[0] || ""} alt="" className="h-12 w-12 rounded object-cover" />
                                        <div>
                                            <p className="font-medium">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.category}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    {product.sellerId?.name || "Legacy / unassigned"}
                                    {product.sellerId?.department && <p className="text-xs text-gray-500">{product.sellerId.department}</p>}
                                </td>
                                <td className="p-3">{product.offerPrice} / {product.price}</td>
                                <td className="p-3">{product.stockQuantity ?? 0}</td>
                                <td className="p-3">{product.isVisible ? "Visible" : "Hidden"}</td>
                                <td className="p-3">
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => openProductEditor(product)} className="text-[var(--color-primary)] underline">Edit</button>
                                        <button type="button" onClick={() => deleteProduct(product._id)} className="text-red-600 underline">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr><td className="p-5 text-gray-500" colSpan={6}>No products found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" onClick={() => setEditingProduct(null)}>
                    <form onSubmit={saveProduct} onClick={(event) => event.stopPropagation()} className="my-6 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="mb-5 text-xl font-semibold">Edit product</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-sm">Name<input required value={editingProduct.name} onChange={(event) => setEditingProduct({ ...editingProduct, name: event.target.value })} className={inputClass} /></label>
                            <label className="text-sm">Category<input required value={editingProduct.category} onChange={(event) => setEditingProduct({ ...editingProduct, category: event.target.value })} className={inputClass} /></label>
                            <label className="text-sm">Regular price<input required min="0" step="0.01" type="number" value={editingProduct.price} onChange={(event) => setEditingProduct({ ...editingProduct, price: event.target.value })} className={inputClass} /></label>
                            <label className="text-sm">Offer price<input required min="0" step="0.01" type="number" value={editingProduct.offerPrice} onChange={(event) => setEditingProduct({ ...editingProduct, offerPrice: event.target.value })} className={inputClass} /></label>
                            <label className="text-sm">Stock quantity<input required min="0" step="1" type="number" value={editingProduct.stockQuantity ?? 0} onChange={(event) => setEditingProduct({ ...editingProduct, stockQuantity: event.target.value })} className={inputClass} /></label>
                            <label className="flex items-center gap-2 pt-6 text-sm">
                                <input type="checkbox" checked={Boolean(editingProduct.isVisible)} onChange={(event) => setEditingProduct({ ...editingProduct, isVisible: event.target.checked })} />
                                Visible in store
                            </label>
                        </div>
                        <label className="mt-4 block text-sm">Description (one line per item)
                            <textarea required rows={4} value={editingProduct.description} onChange={(event) => setEditingProduct({ ...editingProduct, description: event.target.value })} className={inputClass} />
                        </label>
                        <label className="mt-4 block text-sm">Image URLs (one URL per line)
                            <textarea required rows={3} value={editingProduct.image} onChange={(event) => setEditingProduct({ ...editingProduct, image: event.target.value })} className={inputClass} />
                        </label>
                        <label className="mt-4 flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={Boolean(editingProduct.isBestSeller)} onChange={(event) => setEditingProduct({ ...editingProduct, isBestSeller: event.target.checked })} />
                            Mark as best seller
                        </label>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingProduct(null)} className="rounded border border-gray-300 px-4 py-2">Cancel</button>
                            <button type="submit" disabled={saving} className="rounded bg-[var(--color-primary)] px-4 py-2 text-white disabled:opacity-60">
                                {saving ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
};

export default AdminDashboard;

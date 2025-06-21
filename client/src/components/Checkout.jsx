// In your component
const handlePayment = async (amount) => {
    // 1. Create order on backend
    const { data } = await axios.post("/api/payment/create-order", { amount });
    if (!data.success) return alert("Order creation failed");

    // 2. Open Razorpay checkout
    const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY, // Razorpay key
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: "Your Shop Name",
        description: "Order Payment",
        handler: function (response) {
            // Handle payment success here (response.razorpay_payment_id, etc.)
            alert("Payment successful!");
        },
        prefill: {
            name: "Customer Name",
            email: "customer@example.com",
        },
        theme: { color: "#3399cc" },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
};F
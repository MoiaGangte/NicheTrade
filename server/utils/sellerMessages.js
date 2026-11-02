const formatDate = (date = new Date()) => new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
}).format(date);

export const sellerActionMessages = ({ action, sellerName, reason = "", note = "", date = new Date() }) => {
    const formattedDate = formatDate(date);
    if (action === "suspend") {
        return {
            subject: "Your NicheTrade seller account has been suspended",
            body: `Hello ${sellerName}, your seller account was suspended on ${formattedDate} by the NicheTrade admin team. Reason: ${reason}. While suspended you cannot add or edit listings, and your current listings are hidden. If you think this is a mistake, please contact support.`,
        };
    }
    if (action === "ban") {
        return {
            subject: "Your NicheTrade seller account has been banned",
            body: `Hello ${sellerName}, your seller account was banned on ${formattedDate}. Reason: ${reason}. Your listings are hidden and seller features are disabled. If you think this is a mistake, please contact support.`,
        };
    }
    return {
        subject: "Your NicheTrade seller account is active again",
        body: `Hello ${sellerName}, your seller account was restored on ${formattedDate}. ${note ? `${note.trim()} ` : ""}You can use seller features again.`,
    };
};

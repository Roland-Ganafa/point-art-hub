/**
 * Convert a number to words in British English format for currency
 * Example: 150000 -> "One Hundred Fifty Thousand Shillings Only"
 */
export const numberToWords = (num: number): string => {
    if (num === 0) return "Zero Shillings Only";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

    const convertLessThanThousand = (n: number): string => {
        if (n === 0) return "";

        let result = "";

        if (n >= 100) {
            result += ones[Math.floor(n / 100)] + " Hundred ";
            n %= 100;
        }

        if (n >= 20) {
            result += tens[Math.floor(n / 10)] + " ";
            n %= 10;
        } else if (n >= 10) {
            result += teens[n - 10] + " ";
            return result.trim();
        }

        if (n > 0) {
            result += ones[n] + " ";
        }

        return result.trim();
    };

    let result = "";
    let billion = Math.floor(num / 1000000000);
    let million = Math.floor((num % 1000000000) / 1000000);
    let thousand = Math.floor((num % 1000000) / 1000);
    let remainder = num % 1000;

    if (billion > 0) {
        result += convertLessThanThousand(billion) + " Billion ";
    }

    if (million > 0) {
        result += convertLessThanThousand(million) + " Million ";
    }

    if (thousand > 0) {
        result += convertLessThanThousand(thousand) + " Thousand ";
    }

    if (remainder > 0) {
        result += convertLessThanThousand(remainder);
    }

    return result.trim() + " Shillings Only";
};

/**
 * Format currency for UGX
 */
export const formatUGX = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return "UGX 0";
    return `UGX ${amount.toLocaleString()}`;
};

/**
 * Generate a unique invoice number (5 digits)
 */
export const generateInvoiceNumber = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const combined = (timestamp + random) % 100000;
    return combined.toString().padStart(5, '0');
};

/**
 * Generate a unique reference number (10 digits)
 */
export const generateReferenceNumber = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const combined = (timestamp + random) % 10000000000;
    return combined.toString().padStart(10, '0');
};

/**
 * Calculate line item amount
 */
export const calculateLineAmount = (quantity: number, rate: number): number => {
    return Math.round(quantity * rate * 100) / 100;
};

/**
 * Calculate total invoice amount from line items
 */
export const calculateInvoiceTotal = (items: Array<{ quantity: number; rate: number }>): number => {
    return items.reduce((total, item) => {
        return total + calculateLineAmount(item.quantity, item.rate);
    }, 0);
};

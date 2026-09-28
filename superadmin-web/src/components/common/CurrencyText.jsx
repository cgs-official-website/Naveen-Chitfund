import React from 'react';
export const formatIndianRupees = (val, showDecimals = false) => {
    if (isNaN(val))
        return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: showDecimals ? 2 : 0,
        minimumFractionDigits: showDecimals ? 2 : 0,
    }).format(val);
};
export const CurrencyText = ({ amount, paise, className = '', showDecimals = false, }) => {
    let val = 0;
    if (paise !== undefined && paise !== null) {
        val = Number(paise) / 100;
    }
    else if (amount !== undefined && amount !== null) {
        val = Number(amount);
    }
    return <span className={`font-medium ${className}`}>{formatIndianRupees(val, showDecimals)}</span>;
};

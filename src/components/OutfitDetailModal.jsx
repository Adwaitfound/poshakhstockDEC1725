import React from 'react'

export default function OutfitDetailModal({ outfit, inventoryItem, onClose }) {
    if (!outfit || !inventoryItem) return null

    const sizes = ['S', 'M', 'L', 'XL', 'XXL']
    const stockBreakdown = inventoryItem.stockBreakdown || {}

    const getSizeCount = (size) => {
        return parseInt(stockBreakdown[size]) || 0
    }

    const totalStock = sizes.reduce((sum, size) => sum + getSizeCount(size), 0)

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-4 sm:p-6 border-b-2 border-lime-glow bg-gradient-to-r from-emerald-pine to-emerald-800">
                    <h2 className="text-lg sm:text-xl font-bold text-white">{outfit.name}</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">×</button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {/* Outfit Image */}
                    <div className="mb-6">
                        <div className="w-full h-40 bg-gray-100 rounded-2xl overflow-hidden mb-4">
                            <img src={outfit.imageUrl} className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Stock Summary */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-lime-glow/20 p-3 rounded-xl">
                            <p className="text-xs text-emerald-pine font-semibold uppercase">Total Stock</p>
                            <p className="text-2xl font-bold text-emerald-pine">{totalStock}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-xl">
                            <p className="text-xs text-green-700 font-semibold uppercase">Sold</p>
                            <p className="text-2xl font-bold text-green-700">{outfit.qty || 0}</p>
                        </div>
                    </div>

                    {/* Size Breakdown */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-800 mb-3">Stock by Size</h3>
                        {sizes.map(size => {
                            const count = getSizeCount(size)
                            const percentage = totalStock > 0 ? (count / totalStock) * 100 : 0
                            return (
                                <div key={size} className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-pine text-white rounded-lg flex items-center justify-center font-bold text-sm">
                                        {size}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-gray-200 h-8 rounded-lg overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-lime-glow to-green-tea h-full flex items-center justify-center transition-all"
                                                style={{ width: `${percentage}%` }}
                                            >
                                                {count > 0 && <span className="text-xs font-bold text-emerald-pine">{count}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right w-12">
                                        <p className="font-bold text-emerald-pine">{count}</p>
                                        <p className="text-xs text-gray-500">{percentage.toFixed(0)}%</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Revenue Info */}
                    <div className="mt-6 pt-4 border-t-2 border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-semibold">Total Revenue</span>
                            <span className="text-lg font-bold text-green-600">₹{(outfit.revenue || 0).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-gray-200 p-4 sm:p-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-emerald-pine text-white font-bold rounded-xl hover:bg-emerald-800 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

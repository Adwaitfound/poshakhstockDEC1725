import React from 'react'

export default function InventoryDetailModal({ item, onClose, onOpenEdit, onOpenStock, onViewHistory, onDelete }) {
    if (!item) return null
    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center modal-enter backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl h-[85vh] sm:h-auto overflow-hidden flex flex-col shadow-2xl border dark:border-gray-800 border dark:border-gray-800">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900 flex-shrink-0">
                    <h3 className="font-bold text-lg text-gray-900">Item Details</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 dark:text-gray-500 hover:text-gray-600">
                        <span className="text-2xl">×</span>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-gray-100">
                        {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={() => { onClose(); onOpenEdit && onOpenEdit(item) }} className="py-3 px-4 bg-white border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm hover:border-brand dark:hover:border-green-500 active:bg-gray-50 dark:bg-gray-900 dark:active:bg-gray-700 transition text-gray-900 dark:text-white dark:text-white">Edit</button>
                        <button onClick={() => { onClose(); onOpenStock && onOpenStock(item, 'ADD') }} className="py-3 px-4 bg-white border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm hover:border-brand dark:hover:border-green-500 active:bg-gray-50 dark:bg-gray-900 dark:active:bg-gray-700 transition text-gray-900 dark:text-white dark:text-white">Adjust Stock</button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
                        {item.type === 'fabric' ? (
                            <>
                                <div className="flex justify-between text-sm"><span>Cost / m</span><span>₹{item.costPerMeter || 0}</span></div>
                                <div className="flex justify-between text-sm"><span>Total Length</span><span>{item.currentLength || 0} {item.unit || 'm'}</span></div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between text-sm"><span>Selling</span><span>₹{item.sellingPrice || 0}</span></div>
                                <div className="flex justify-between text-sm"><span>Stitching</span><span>₹{item.stitchingCost || 0}</span></div>
                            </>
                        )}
                    </div>

                    {/* Stock Breakdown for Outfits */}
                    {item.type === 'outfit' && item.stockBreakdown && (
                        <div className="mt-4">
                            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Stock by Size</h4>
                            <div className="grid grid-cols-5 gap-2">
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                                    <div key={size} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-center">
                                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{size}</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{item.stockBreakdown[size] || 0}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-4">
                        <button onClick={() => { onViewHistory && onViewHistory(item) }} className="w-full py-3 bg-white border rounded-xl">View Transaction History</button>
                        <button onClick={() => { onDelete && onDelete(item) }} className="w-full py-3 mt-2 text-red-600">Delete Item</button>
                    </div>
                </div>
            </div>
        </div >
    )
}

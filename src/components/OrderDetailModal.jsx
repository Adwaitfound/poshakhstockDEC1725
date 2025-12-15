import React from 'react'

export default function OrderDetailModal({ order, onClose, onEdit, onShip }) {
    if (!order) return null
    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center modal-enter backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl h-[85vh] sm:h-auto overflow-hidden flex flex-col shadow-2xl border dark:border-gray-800">
                <div className="bg-gray-50 dark:bg-gray-900 p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg">Order #{order.orderNumber}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-400 dark:text-gray-500 hover:text-gray-600">
                        <span className="text-2xl">×</span>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex gap-4 mb-6">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {order.imageUrl && <img src={order.imageUrl} className="w-full h-full object-cover" alt={order.outfitName} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-base">{order.customerName}</h4>
                            <p className="text-sm text-gray-500">
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Size: {order.size || 'M'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={() => { onEdit && onEdit(order) }} className="py-3 px-4 bg-brand text-white rounded-xl font-semibold text-sm active:bg-brand-dark transition">Edit Order</button>
                        <button onClick={() => { onShip && onShip(order) }} className="py-3 px-4 bg-white border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm hover:border-brand active:bg-gray-50 dark:bg-gray-900 transition">Ship / Complete</button>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400 dark:text-gray-500 className="font-semibold">₹{order.finalSellingPrice || order.orderTotal || 0}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400 dark:text-gray-500 className="font-semibold">{order.status}</span></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

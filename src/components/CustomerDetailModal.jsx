import React, { useState, useMemo } from 'react'
import { Edit2, Save, X, AlertTriangle, Package, Trash2 } from 'lucide-react'
import { getDb } from '../firebase'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'

export default function CustomerDetailModal({ customer, onClose, allOrders = [], inventoryItems = [] }) {
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        name: customer?.name || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        email: customer?.email || '',
        city: customer?.city || '',
        state: customer?.state || ''
    })
    const [saving, setSaving] = useState(false)

    // Get outfit options from inventory
    const outfitOptions = useMemo(() => {
        return inventoryItems.filter(item => item.type === 'outfit')
    }, [inventoryItems])

    // Get customer orders with outfit name matching
    const customerOrders = useMemo(() => {
        if (!customer) return []
        const name = customer.name.toLowerCase().trim()
        return allOrders
            .filter(o => o.customerName && o.customerName.toLowerCase().trim() === name)
            .map(order => {
                const outfitName = order.outfitName || order.productName || ''
                const matchesInventory = outfitOptions.some(o => o.name.toLowerCase() === outfitName.toLowerCase())
                return { ...order, matchesInventory, outfitName }
            })
            .sort((a, b) => {
                const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
                const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
                return dateB - dateA
            })
    }, [customer, allOrders, outfitOptions])

    const unmatchedOrders = customerOrders.filter(o => !o.matchesInventory && o.outfitName)

    // Calculate customer summary statistics
    const customerStats = useMemo(() => {
        const getOrderCost = (order) => {
            // Priority: importedData Order Total > orderTotal > finalSellingPrice > Product Price > Total
            if (order.importedData?.['Order Total']) {
                const orderTotal = String(order.importedData['Order Total']).replace(/[^0-9.-]/g, '')
                const parsed = parseFloat(orderTotal)
                if (!isNaN(parsed) && parsed > 0) return parsed
            }
            if (order.orderTotal) return parseFloat(order.orderTotal)
            if (order.finalSellingPrice) return parseFloat(order.finalSellingPrice)
            if (order.importedData?.['Product Price']) {
                const price = String(order.importedData['Product Price']).replace(/[^0-9.-]/g, '')
                return parseFloat(price) || 0
            }
            if (order.importedData?.['Total']) {
                const total = String(order.importedData['Total']).replace(/[^0-9.-]/g, '')
                return parseFloat(total) || 0
            }
            return 0
        }

        const totalSpent = customerOrders.reduce((sum, order) => sum + getOrderCost(order), 0)
        const totalOrders = customerOrders.length
        const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
        const completedOrders = customerOrders.filter(o => o.status === 'Order Shipped (Completed)').length

        return { totalSpent, totalOrders, avgOrderValue, completedOrders }
    }, [customerOrders])

    const handleSaveCustomer = async () => {
        if (!editForm.name.trim()) {
            alert('Customer name is required')
            return
        }

        setSaving(true)
        try {
            const db = getDb()
            // Update all orders with this customer's name
            const updates = customerOrders.map(order =>
                updateDoc(doc(db, 'production_orders', order.id), {
                    customerName: editForm.name,
                    phone: editForm.phone || order.phone,
                    address: editForm.address || order.address,
                    email: editForm.email || order.email,
                    city: editForm.city || order.city,
                    state: editForm.state || order.state
                })
            )
            await Promise.all(updates)
            alert('Customer information updated!')
            setIsEditing(false)
        } catch (error) {
            console.error('Error updating customer:', error)
            alert('Error updating customer: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateOutfitName = async (orderId, newOutfitName, newSize) => {
        if (!newOutfitName) return

        // Find the outfit in inventory to get its image
        const outfit = inventoryItems.find(item =>
            item.type === 'outfit' && item.name.toLowerCase() === newOutfitName.toLowerCase()
        )

        try {
            const db = getDb()
            const updateData = {
                outfitName: newOutfitName,
                imageUrl: outfit?.imageUrl || ''
            }

            // Update size if provided
            if (newSize) {
                updateData.size = newSize
            }

            // Keep the customer's original order total - do not overwrite with default outfit cost

            await updateDoc(doc(db, 'production_orders', orderId), updateData)
            alert(`Order updated!\nOutfit: ${newOutfitName}${newSize ? `\nSize: ${newSize}` : ''}\n\nNote: Original order total has been preserved.`)
        } catch (error) {
            console.error('Error updating order:', error)
            alert('Error: ' + error.message)
        }
    }

    const handleDeleteOrder = async (orderId, orderNumber) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete order #${orderNumber}?\n\nThis action cannot be undone.`
        )

        if (!confirmed) return

        try {
            const db = getDb()
            await deleteDoc(doc(db, 'production_orders', orderId))
            alert(`Order #${orderNumber} has been deleted successfully`)
        } catch (error) {
            console.error('Error deleting order:', error)
            alert('Error deleting order: ' + error.message)
        }
    }

    if (!customer) return null

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center modal-enter backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border dark:border-gray-800 border dark:border-gray-800">
                <div className="bg-gray-50 dark:bg-gray-900 p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg">{isEditing ? 'Edit Customer' : customer.name}</h3>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 rounded-full hover:bg-white text-blue-600"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white text-gray-400 dark:text-gray-500 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Edit Form */}
                    {isEditing ? (
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 Name *</label>
                                <input
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mt-1"
                                    placeholder="Customer name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-700
                                    <input
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mt-1"
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700
                                    <input
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mt-1"
                                        placeholder="Email"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700
                                <input
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mt-1"
                                    placeholder="Street address"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-700
                                    <input
                                        value={editForm.city}
                                        onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mt-1"
                                        placeholder="City"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700
                                    <input
                                        value={editForm.state}
                                        onChange={e => setEditForm({ ...editForm, state: e.target.value })}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl mt-1"
                                        placeholder="State"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleSaveCustomer}
                                    disabled={saving}
                                    className="flex-1 bg-brand text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false)
                                        setEditForm({
                                            name: customer.name,
                                            phone: customer.phone || '',
                                            address: customer.address || '',
                                            email: customer.email || '',
                                            city: customer.city || '',
                                            state: customer.state || ''
                                        })
                                    }}
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-600
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Customer Summary */}
                            <div className="bg-gradient-to-br from-brand to-green-600 p-5 rounded-2xl text-white mb-4 shadow-lg">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-white backdrop-blur-sm flex items-center justify-center font-bold text-xl border-2 border-white/30">
                                        {customer.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-lg">{customer.name}</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {customer.phone && (
                                                <span className="text-xs bg-white px-2 py-0.5 rounded-full">📞 {customer.phone}</span>
                                            )}
                                            {customer.email && (
                                                <span className="text-xs bg-white px-2 py-0.5 rounded-full">✉️ {customer.email}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white backdrop-blur-sm rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold">₹{(customerStats.totalSpent / 1000).toFixed(1)}k</p>
                                        <p className="text-xs opacity-80 mt-1">Total Spent</p>
                                    </div>
                                    <div className="bg-white backdrop-blur-sm rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold">{customerStats.totalOrders}</p>
                                        <p className="text-xs opacity-80 mt-1">Total Orders</p>
                                    </div>
                                    <div className="bg-white backdrop-blur-sm rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold">₹{customerStats.avgOrderValue.toFixed(0)}</p>
                                        <p className="text-xs opacity-80 mt-1">Avg Order</p>
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            {customer.address && (
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl mb-4">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase mb-1">Address</p>
                                    <p className="text-sm text-gray-900
                                        {customer.address}
                                        {customer.city && `, ${customer.city}`}
                                        {customer.state && `, ${customer.state}`}
                                    </p>
                                </div>
                            )}

                            {/* Imported Custom Fields */}
                            {customer.customFields && Object.keys(customer.customFields).length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-blue-500 rounded"></span>
                                        Imported Data
                                    </h4>
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                            {Object.entries(customer.customFields).map(([key, value]) => (
                                                <div key={key} className="">
                                                    <p className="text-xs text-blue-600 font-semibold">{key}</p>
                                                    <p className="text-sm text-gray-900
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Unmatched Orders Warning */}
                    {!isEditing && unmatchedOrders.length > 0 && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl mb-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-yellow-900 text-sm mb-1">
                                        {unmatchedOrders.length} Order{unmatchedOrders.length > 1 ? 's' : ''} Need Outfit Matching
                                    </h4>
                                    <p className="text-xs text-yellow-800">
                                        Update outfit names below to match your inventory
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order History */}
                    {!isEditing && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Order History ({customerOrders.length})
                            </h4>
                            <div className="space-y-3">
                                {customerOrders.map((order, idx) => (
                                    <OrderRow
                                        key={idx}
                                        order={order}
                                        outfitOptions={outfitOptions}
                                        onUpdateOutfit={handleUpdateOutfitName}
                                        onDeleteOrder={handleDeleteOrder}
                                    />
                                ))}
                                {customerOrders.length === 0 && (
                                    <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                                        No orders yet
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function OrderRow({ order, outfitOptions, onUpdateOutfit, onDeleteOrder }) {
    const [editing, setEditing] = useState(false)
    const [selectedOutfit, setSelectedOutfit] = useState(order.outfitName)
    const [selectedSize, setSelectedSize] = useState(order.size || 'M')

    const formatDate = (date) => {
        if (!date) return 'N/A'
        const d = date.toDate ? date.toDate() : new Date(date)
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const getOrderCost = () => {
        // Priority: importedData Order Total > orderTotal > finalSellingPrice > Product Price > Total
        if (order.importedData?.['Order Total']) {
            const orderTotal = String(order.importedData['Order Total']).replace(/[^0-9.-]/g, '')
            const parsed = parseFloat(orderTotal)
            if (!isNaN(parsed) && parsed > 0) return parsed
        }
        if (order.orderTotal) return order.orderTotal
        if (order.finalSellingPrice) return order.finalSellingPrice
        if (order.importedData?.['Product Price']) {
            const price = String(order.importedData['Product Price']).replace(/[^0-9.-]/g, '')
            return parseFloat(price) || 0
        }
        if (order.importedData?.['Total']) {
            const total = String(order.importedData['Total']).replace(/[^0-9.-]/g, '')
            return parseFloat(total) || 0
        }
        return 0
    }

    return (
        <div className={`bg-gradient-to-r ${order.matchesInventory ? 'from-white to-gray-50 border-gray-200 dark:border-gray-700 : 'from-yellow-50 to-orange-50 border-yellow-300'} border-2 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-brand">#{order.orderNumber}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${order.status === 'Order Shipped (Completed)' ? 'bg-green-100 text-green-700' :
                            order.status === 'Received from Tailor' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'Sent to Tailor' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600
                            }`}>
                            {order.status}
                        </span>
                        {!order.matchesInventory && order.outfitName && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold animate-pulse">
                                ⚠️ NEEDS FIX
                            </span>
                        )}
                        <button
                            onClick={() => onDeleteOrder(order.id, order.orderNumber)}
                            className="ml-auto text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete order"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {editing ? (
                        <div className="space-y-2 mt-2">
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedOutfit}
                                    onChange={e => setSelectedOutfit(e.target.value)}
                                    className="flex-1 p-2 border-2 border-brand rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand/20"
                                >
                                    <option value={order.outfitName}>{order.outfitName} (current)</option>
                                    {outfitOptions.map(outfit => (
                                        <option key={outfit.id} value={outfit.name}>
                                            {outfit.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedSize}
                                    onChange={e => setSelectedSize(e.target.value)}
                                    className="p-2 border-2 border-brand rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand/20 w-20"
                                >
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        onUpdateOutfit(order.id, selectedOutfit, selectedSize)
                                        setEditing(false)
                                    }}
                                    className="bg-brand text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm flex-1"
                                >
                                    ✓ Save
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedOutfit(order.outfitName)
                                        setSelectedSize(order.size || 'M')
                                        setEditing(false)
                                    }}
                                    className="text-gray-500 dark:text-gray-400 dark:text-gray-500 px-4 py-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-base font-bold text-gray-900 dark:text-white || 'Unknown'}</p>
                            {order.outfitName && (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit outfit name"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>📅 {formatDate(order.createdAt)}</span>
                        {order.size && <span className="bg-gray-100 px-2 py-0.5 rounded font-semibold">Size {order.size}</span>}
                    </div>
                </div>

                <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-green-600">₹{getOrderCost()}</p>
                </div>
            </div>

            {/* Show imported data if available */}
            {order.importedData && Object.keys(order.importedData).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase mb-2">📦 Order Details</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(order.importedData).slice(0, 6).map(([key, value]) => (
                            <div key={key} className="bg-white px-2 py-1 rounded">
                                <p className="text-xs text-gray-500">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

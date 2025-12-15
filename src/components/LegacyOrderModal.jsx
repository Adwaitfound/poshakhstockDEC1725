import React, { useState } from 'react'
import { getDb } from '../firebase'
import { doc, updateDoc, serverTimestamp, addDoc, collection, increment } from 'firebase/firestore'
import { FABRICS_COLLECTION, ORDERS_COLLECTION } from '../lib/utils'

export default function LegacyOrderModal({ visible, inventoryItems = [], userProfile, onClose, onDataChanged }) {
    const [form, setForm] = useState({
        orderNumber: '', customerName: '', outfitName: '', size: 'M', fabricId: '',
        status: 'Sent to Tailor', sellingPrice: '', deductStock: false, cutAmount: '',
        notes: '', phone: '', address: '', discount: '', source: '', acquisitionCost: '',
        paymentMethod: 'Prepaid', city: '', state: '', codCharge: '', shippingCost: '',
        codRemittanceDate: ''
    })
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState('')

    if (!visible) return null

    const handleSubmit = async () => {
        setIsUploading(true)
        setError('')
        try {
            const { orderNumber, customerName, outfitName, size, fabricId, status, sellingPrice, deductStock, cutAmount, notes, phone, address, discount, source, acquisitionCost, paymentMethod, city, state, codCharge, shippingCost, codRemittanceDate } = form
            if (!orderNumber || !customerName) throw new Error("Order # and Customer Name are required")

            // Outfit Validation and Sold Increment
            let linkedOutfit = null
            if (outfitName) {
                linkedOutfit = inventoryItems.find(i => i.name.toLowerCase() === outfitName.toLowerCase() && i.type === 'outfit')
                if (!linkedOutfit) {
                    throw new Error(`Outfit '${outfitName}' must be an existing outfit in Inventory.`)
                }
            }

            const db = getDb()
            const orderData = {
                orderNumber, customerName, outfitName: linkedOutfit ? linkedOutfit.name : outfitName, size, status, notes, phone, address, discount, source,
                acquisitionCost: parseFloat(acquisitionCost) || 0,
                paymentMethod: paymentMethod || 'Prepaid',
                city: city || '',
                state: state || '',
                codCharge: parseFloat(codCharge) || 0,
                shippingCost: parseFloat(shippingCost) || 0,
                codRemittanceDate: codRemittanceDate || '',
                usedByEmail: userProfile?.name, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
            }

            if (fabricId) {
                const fabric = inventoryItems.find(f => f.id === fabricId)
                if (fabric) {
                    orderData.fabricId = fabricId
                    orderData.fabricName = fabric.name
                    orderData.imageUrl = fabric.imageUrl
                    const cut = parseFloat(cutAmount)
                    if (deductStock && cut > 0) {
                        orderData.cutAmount = cut
                        const fabricRef = doc(db, FABRICS_COLLECTION, fabricId)
                        await updateDoc(fabricRef, { currentLength: increment(-cut), updatedAt: serverTimestamp() })
                        await addDoc(collection(fabricRef, 'history'), { amountUsed: cut, orderNumber: orderNumber, productName: outfitName, status: 'Manual Entry', type: 'CUT', usedByEmail: userProfile?.name, usedAt: serverTimestamp() })
                    }
                }
            } else {
                // If no fabric linked, use outfit image if found
                orderData.imageUrl = linkedOutfit ? linkedOutfit.imageUrl : `https://placehold.co/150x150/e2e8f0/64748b?text=${orderNumber}`
            }

            if (status === 'Order Shipped (Completed)') {
                const finalPrice = parseFloat(sellingPrice)
                if (finalPrice > 0) orderData.finalSellingPrice = finalPrice

                // Increment sold count for the outfit if it was found
                if (linkedOutfit) {
                    const outfitRef = doc(db, FABRICS_COLLECTION, linkedOutfit.id)
                    const soldQty = 1 // Assuming 1 unit sold per manual log entry

                    await updateDoc(outfitRef, {
                        manualSoldCount: increment(soldQty),
                        updatedAt: serverTimestamp()
                    })

                    await addDoc(collection(outfitRef, 'history'), {
                        type: 'OUTFIT_SOLD_MANUAL',
                        amountUsed: soldQty,
                        size: size,
                        status: 'Legacy Sold',
                        orderNumber: orderNumber,
                        usedByEmail: userProfile?.name,
                        usedAt: serverTimestamp()
                    })
                }
            }

            if (!orderData.finalSellingPrice && sellingPrice) orderData.finalSellingPrice = parseFloat(sellingPrice)

            await addDoc(collection(db, ORDERS_COLLECTION), orderData)

            // Reset form
            setForm({
                orderNumber: '', customerName: '', outfitName: '', size: 'M', fabricId: '',
                status: 'Sent to Tailor', sellingPrice: '', deductStock: false, cutAmount: '',
                notes: '', phone: '', address: '', discount: '', source: '', acquisitionCost: '',
                paymentMethod: 'Prepaid', city: '', state: '', codCharge: '', shippingCost: '',
                codRemittanceDate: ''
            })
            if (onDataChanged) await onDataChanged()
            onClose()
        } catch (e) {
            console.error(e)
            setError(e.message || 'Failed to add order')
        }
        setIsUploading(false)
    }

    const fabrics = inventoryItems.filter(i => i.type === 'fabric')

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center modal-enter backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl h-[92vh] sm:h-auto flex flex-col border dark:border-gray-800">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white Past Order</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 dark:text-gray-500 hover:text-gray-600">
                        <span className="text-2xl">×</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {error && (
                        <div className="m-4 mb-0 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
                    )}
                    <div className="space-y-4 p-6 pt-4">
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Customer Details</h4>
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <input className="w-full p-2 bg-white rounded-lg border-none text-sm" placeholder="Order # (Required)" value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })} />
                                <input className="w-full p-2 bg-white rounded-lg border-none text-sm" placeholder="Customer Name (Required)" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input className="w-full p-2 bg-white rounded-lg border-none text-sm" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                <input className="w-full p-2 bg-white rounded-lg border-none text-sm" placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Product Info</h4>
                            <div className="grid grid-cols-2 gap-3 mb-2">
                                <input className="w-full p-2 bg-white rounded-lg border-none text-sm" placeholder="Outfit Name" value={form.outfitName} onChange={e => setForm({ ...form, outfitName: e.target.value })} />
                                <select className="w-full p-2 bg-white rounded-lg border-none text-sm" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                                    <option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
                                </select>
                            </div>
                            <select className="w-full p-2 bg-white rounded-lg border-none text-sm mb-2" value={form.fabricId} onChange={e => setForm({ ...form, fabricId: e.target.value })}>
                                <option value="">— Select Fabric (Optional) —</option>
                                {fabrics.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
                            </select>
                            {form.fabricId && (
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input type="checkbox" checked={form.deductStock} onChange={e => setForm({ ...form, deductStock: e.target.checked })} />
                                        Deduct Stock
                                    </label>
                                    {form.deductStock && (<input type="number" step="0.1" className="w-full p-2 bg-white rounded-lg border-none text-sm" placeholder="Cut Amount (m)" value={form.cutAmount} onChange={e => setForm({ ...form, cutAmount: e.target.value })} />)}
                                </div>
                            )}
                            <textarea className="w-full p-2 bg-white rounded-lg border-none text-sm mt-2" rows="2" placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}></textarea>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Status & Pricing</h4>
                            <select className="w-full p-2 bg-white rounded-lg border-none text-sm mb-2" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option>Sent to Tailor</option>
                                <option>Received from Tailor</option>
                                <option>Order Shipped (Completed)</option>
                                <option>Cancelled</option>
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" className="w-full p-2 bg-white rounded-lg border-none text-sm" placeholder="Selling Price (₹)" value={form.sellingPrice} onChange={e => setForm({ ...form, sellingPrice: e.target.value })} />
                                <input type="number" className="w-full p-2 bg-white rounded-lg border-none text-sm" placeholder="Discount (₹)" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 flex-shrink-0 bg-white
                        <button onClick={handleSubmit} disabled={isUploading} className="flex-1 bg-brand text-white py-3 rounded-xl font-bold shadow-lg">
                            {isUploading ? 'Saving...' : 'Add Record'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

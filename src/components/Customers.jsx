import React, { useMemo, useState } from 'react'
import { Search, Users, Trash2 } from 'lucide-react'

export default function Customers({ allOrders = [], onViewCustomer = () => { }, onDeleteCustomer = () => { }, searchTerm = '', setSearchTerm = () => { } }) {
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const cleanNumber = (val) => {
        if (typeof val === 'number') return val
        if (!val) return 0
        const s = String(val).replace(/[^0-9.-]/g, '')
        return parseFloat(s) || 0
    }

    const getCustomerStats = (customerName) => {
        if (!customerName) return null
        const name = customerName.toLowerCase().trim()
        const history = allOrders.filter(o => o.customerName && o.customerName.toLowerCase().trim() === name)
        const totalSpent = history.reduce((acc, curr) => {
            const val = cleanNumber(curr.orderTotal) || cleanNumber(curr.finalSellingPrice) || cleanNumber(curr.importedData?.['Product Price']) || 0
            return acc + val
        }, 0)
        const totalItems = history.length
        return { history, totalSpent, totalItems }
    }

    const customerList = useMemo(() => {
        const uniqueCustomers = new Map()
        allOrders.forEach(o => {
            if (o.customerName) {
                const key = o.customerName.toLowerCase().trim()
                const existing = uniqueCustomers.get(key) || {
                    name: o.customerName,
                    phone: o.phone || '',
                    address: o.address || '',
                    email: o.email || '',
                    city: o.city || '',
                    state: o.state || '',
                    source: 'Order History',
                    customFields: o.importedData || {}
                }
                if (o.phone) existing.phone = o.phone
                if (o.address) existing.address = o.address
                if (o.city) existing.city = o.city
                if (o.state) existing.state = o.state
                if (o.importedData?.['Customer Email']) existing.email = o.importedData['Customer Email']
                uniqueCustomers.set(key, existing)
            }
        })
        let list = Array.from(uniqueCustomers.values())
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            list = list.filter(c => c.name.toLowerCase().includes(term) || (c.phone && c.phone.includes(term)))
        }
        return list.sort((a, b) => a.name.localeCompare(b.name))
    }, [allOrders, searchTerm])

    return (
        <div className="space-y-6 fade-in">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
                <div className="text-xs text-gray-500 font-medium bg-white px-3 py-1 rounded-full shadow-sm">{customerList.length} Total</div>
            </div>

            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search className="w-5 h-5" />
                </span>
                <input className="w-full pl-10 p-3 bg-white rounded-xl border-none shadow-sm text-sm" placeholder="Search customers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-3">
                {customerList.map((customer, idx) => {
                    const stats = getCustomerStats(customer.name)
                    return (
                        <div key={idx} className="bg-white p-4 rounded-2xl shadow-card flex items-center justify-between">
                            <div onClick={() => onViewCustomer(customer)} className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                    {customer.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{customer.name}</h4>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        {customer.phone && <span>📞 {customer.phone}</span>}
                                        {customer.source === 'Saved' && <span className="bg-green-50 text-green-600 px-1 rounded">Imported</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-3">
                                <div>
                                    <p className="text-lg font-bold text-gray-900">{stats.totalItems}</p>
                                    <p className="text-[10px] text-gray-400 uppercase">Orders</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteConfirm(customer.name)
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Delete customer and all orders"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )
                })}
                {customerList.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No customers found.</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Customer?</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            This will permanently delete <strong>{deleteConfirm}</strong> and all their orders. This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onDeleteCustomer(deleteConfirm)
                                    setDeleteConfirm(null)
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

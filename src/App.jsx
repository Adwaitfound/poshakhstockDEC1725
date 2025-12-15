import React, { useState } from 'react'
import Inventory from './components/Inventory'
import Orders from './components/Orders'
import AddItem from './components/AddItem'
import SheetImport from './components/SheetImport'
import Dashboard from './components/Dashboard'
import Outfits from './components/Outfits'
import Customers from './components/Customers'
import FinancialInsights from './components/FinancialInsights'
import ProductionModal from './components/ProductionModal'
import { AuthProvider, useAuth } from './context/AuthProvider'
import { initFirebase, subscribeCollection, anonymousSignIn } from './firebase'
import InventoryDetailModal from './components/InventoryDetailModal'
import OrderDetailModal from './components/OrderDetailModal'
import CustomerDetailModal from './components/CustomerDetailModal'
import LegacyOrderModal from './components/LegacyOrderModal'
import StockAdjustModal from './components/StockAdjustModal'
import EditItemModal from './components/EditItemModal'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import ShippingModal from './components/ShippingModal'
import ImageModal from './components/ImageModal'
import HistoryModal from './components/HistoryModal'
import { getDb } from './firebase'
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDocs, query, where, increment, onSnapshot } from 'firebase/firestore'
import { FABRICS_COLLECTION, ORDERS_COLLECTION, cleanNumber, getOutfitTotal } from './lib/utils'

// Simple icon SVG components
const Icons = {
    Home: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>,
    Box: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>,
    Plus: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    Clipboard: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>,
    Table: () => <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /></svg>,
    LogOut: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
    ShoppingBag: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 10a4 4 0 0 1-8 0" /></svg>,
    Users: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} /></svg>,
    TrendingUp: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    Shield: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
}

function LoginForm({ login }) {
    const [name, setName] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await login(name)
            if (!result.ok) {
                setError(result.message)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Your Name</label>
                <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none transition"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading ? 'Please wait...' : 'Sign In'}
            </button>
        </form>
    )
}

function InnerApp() {
    const [activeTab, setActiveTab] = useState('home')
    const { userProfile, login, logout, loading } = useAuth()
    const [nameInput, setNameInput] = useState('')
    const [inventoryItems, setInventoryItems] = useState([])
    const [allOrders, setAllOrders] = useState([])
    const [productionBatches, setProductionBatches] = useState([])
    const [showProductionModal, setShowProductionModal] = useState(false)
    // Modal & UI state
    const [viewInventoryItem, setViewInventoryItem] = useState(null)
    const [viewOrder, setViewOrder] = useState(null)
    const [viewCustomer, setViewCustomer] = useState(null)
    const [showLegacyModal, setShowLegacyModal] = useState(false)
    const [legacyForm, setLegacyForm] = useState({ orderNumber: '', customerName: '', outfitName: '', size: 'M', fabricId: '', status: 'Sent to Tailor', sellingPrice: '', deductStock: false, cutAmount: '', notes: '', phone: '', address: '', discount: '', source: '', acquisitionCost: '', paymentMethod: 'Prepaid', city: '', state: '', codCharge: '', shippingCost: '', codRemittanceDate: '' })
    const [stockAdjustItem, setStockAdjustItem] = useState(null)
    const [stockAdjustType, setStockAdjustType] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const [deleteOrderTargetId, setDeleteOrderTargetId] = useState(null)
    const [deletePassword, setDeletePassword] = useState('')
    const [shippingOrderId, setShippingOrderId] = useState(null)
    const [shippingForm, setShippingForm] = useState({ sellingPrice: '', shippingCost: '', otherExpenses: '' })
    const [selectedImageUrl, setSelectedImageUrl] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const [db, setDb] = useState(null)
    const [historyItemId, setHistoryItemId] = useState(null)

    // initialize firebase and authenticate - matching working HTML version
    React.useEffect(() => {
        try {
            initFirebase()
            const firestore = getDb()
            setDb(firestore)
            anonymousSignIn().then(() => {
                console.log('Firebase authenticated anonymously')

                // Test direct query to verify database access
                getDocs(collection(firestore, 'fabrics')).then(snap => {
                    console.log('Direct fabrics query result:', snap.size, 'documents')
                    if (!snap.empty) {
                        console.log('Sample fabric:', snap.docs[0].data())
                    }
                }).catch(e => console.error('Direct fabrics query error:', e))

                getDocs(collection(firestore, 'production_orders')).then(snap => {
                    console.log('Direct production_orders query result:', snap.size, 'documents')
                    if (!snap.empty) {
                        console.log('Sample order:', snap.docs[0].data())
                    }
                }).catch(e => console.error('Direct production_orders query error:', e))

                getDocs(collection(firestore, 'customers')).then(snap => {
                    console.log('Direct customers query result:', snap.size, 'documents')
                    if (!snap.empty) {
                        console.log('Sample customer:', snap.docs[0].data())
                    }
                }).catch(e => console.error('Direct customers query error:', e))
            }).catch(e => {
                console.error('Auth error:', e)
            })
        } catch (e) {
            console.error('Firebase init error:', e)
        }
    }, [])

    // Load fabrics once on mount - manual refresh required for updates
    React.useEffect(() => {
        if (!db) return
        loadInventory()
    }, [db])

    const loadInventory = async () => {
        try {
            const snap = await getDocs(collection(db, 'fabrics'))
            const validDocs = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d && d.name)
            setInventoryItems(validDocs)
            console.log('Loaded', validDocs.length, 'inventory items')
        } catch (error) {
            console.error('Error loading inventory:', error)
        }
    }

    // Load orders once on mount - manual refresh required for updates
    React.useEffect(() => {
        if (!db) return
        loadOrders()
    }, [db])

    const loadOrders = async () => {
        try {
            const snap = await getDocs(collection(db, 'production_orders'))
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(o => o && o.orderNumber)
            setAllOrders(list)
            console.log('Loaded', list.length, 'orders')
        } catch (error) {
            console.error('Error loading orders:', error)
        }
    }

    // Load production batches once on mount - manual refresh required for updates
    React.useEffect(() => {
        if (!db) return
        loadProductionBatches()
    }, [db])

    const loadProductionBatches = async () => {
        try {
            const snap = await getDocs(collection(db, 'production_batches'))
            const batches = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setProductionBatches(batches)
            console.log('Loaded', batches.length, 'production batches')
        } catch (error) {
            console.error('Error loading production batches:', error)
        }
    }

    const refreshAllData = async () => {
        await Promise.all([loadInventory(), loadOrders(), loadProductionBatches()])
    }

    const openEditModal = (item) => {
        setEditingId(item.id)
    }

    const openStockModal = (item, type) => { setStockAdjustItem(item); setStockAdjustType(type); }

    const handleLegacySubmit = async () => {
        setIsUploading(true)
        try {
            const data = { ...legacyForm, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), usedByEmail: userProfile?.name }
            const db = getDb()
            if (legacyForm.fabricId && legacyForm.deductStock && parseFloat(legacyForm.cutAmount) > 0) {
                const fref = doc(db, FABRICS_COLLECTION, legacyForm.fabricId)
                await updateDoc(fref, { currentLength: increment(-Math.abs(parseFloat(legacyForm.cutAmount) || 0)), updatedAt: serverTimestamp() })
                await addDoc(collection(fref, 'history'), { amountUsed: parseFloat(legacyForm.cutAmount) || 0, orderNumber: legacyForm.orderNumber, status: 'Manual Entry', type: 'CUT', usedByEmail: userProfile?.name, usedAt: serverTimestamp() })
            }
            await addDoc(collection(db, ORDERS_COLLECTION), data)
            setShowLegacyModal(false)
            await loadOrders() // Refresh orders list
        } catch (e) { console.error(e) }
        setIsUploading(false)
    }

    const handleCancelOrder = async (order) => {
        if (!confirm('Cancel this order?')) return
        try {
            const db = getDb()
            await updateDoc(doc(db, ORDERS_COLLECTION, order.id), { status: 'Cancelled', updatedAt: serverTimestamp() })
            if (order.fabricId && order.cutAmount > 0) {
                const fabricRef = doc(db, FABRICS_COLLECTION, order.fabricId)
                await updateDoc(fabricRef, { currentLength: increment(Math.abs(parseFloat(order.cutAmount) || 0)), updatedAt: serverTimestamp() })
                await addDoc(collection(fabricRef, 'history'), { amountUsed: order.cutAmount, orderNumber: `CANCEL-${order.orderNumber}`, type: 'CANCEL_RETURN', status: 'Cancelled', usedAt: serverTimestamp() })
            }
            await Promise.all([loadOrders(), loadInventory()]) // Refresh data
        } catch (e) { console.error(e) }
    }

    const handleDeleteOrder = async () => {
        if (deletePassword !== 'posh123') { alert('Incorrect Password'); return }
        try {
            const db = getDb()
            await deleteDoc(doc(db, ORDERS_COLLECTION, deleteOrderTargetId))
            setDeleteOrderTargetId(null); setDeletePassword('')
            await loadOrders() // Refresh orders list
        } catch (e) { console.error(e) }
    }

    const submitShipping = async () => {
        if (!shippingOrderId) return
        try {
            const db = getDb()
            await updateDoc(doc(db, ORDERS_COLLECTION, shippingOrderId), { status: 'Order Shipped (Completed)', finalSellingPrice: parseFloat(shippingForm.sellingPrice) || 0, shippingCost: parseFloat(shippingForm.shippingCost) || 0, otherExpenses: parseFloat(shippingForm.otherExpenses) || 0, updatedAt: serverTimestamp() })
            setShippingOrderId(null)
            await loadOrders() // Refresh orders list
        } catch (e) { console.error(e) }
    }

    const handleDeleteItem = async (item) => {
        if (!confirm('Delete this item?')) return
        try { const db = getDb(); await deleteDoc(doc(db, FABRICS_COLLECTION, item.id)); setViewInventoryItem(null); await loadInventory() } catch (e) { console.error(e) }
    }

    if (!userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-green-600 mb-2">Poshakh Manager</h1>
                        <p className="text-gray-500 text-sm">Stock & Production Tracking</p>
                    </div>
                    <LoginForm login={login} />
                </div>
            </div>
        )
    }

    const tabs = [
        { id: 'home', label: 'Home', icon: Icons.Home },
        { id: 'inventory', label: 'Inventory', icon: Icons.Box },
        { id: 'orders', label: 'Orders', icon: Icons.Clipboard },
        { id: 'add', label: 'Add', icon: Icons.Plus },
        { id: 'outfits', label: 'Outfits', icon: Icons.ShoppingBag },
        { id: 'customers', label: 'Customers', icon: Icons.Users },
        ...(userProfile?.role === 'admin' ? [{ id: 'financial', label: 'Financial', icon: Icons.TrendingUp }] : []),
    ]

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                        <div>
                            <h1 className="text-base sm:text-lg font-bold text-gray-900">Poshakh Manager</h1>
                            <p className="text-[10px] sm:text-xs text-gray-500">Connected</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={refreshAllData}
                            className="h-9 w-9 sm:h-10 sm:w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center hover:bg-blue-200 active:bg-blue-200"
                            title="Refresh Data"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        {userProfile?.role === 'admin' && (
                            <button onClick={() => setActiveTab('import')} className="h-9 w-9 sm:h-10 sm:w-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center hover:bg-green-200 active:bg-green-200" title="Import">
                                <Icons.Table className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        )}
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900">{userProfile.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{userProfile.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg hover:bg-red-50 active:bg-red-100 text-red-600 transition"
                            title="Logout"
                        >
                            <Icons.LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto pb-24">
                {activeTab === 'home' && <Dashboard allOrders={allOrders} inventoryItems={inventoryItems} userRole={userProfile?.role} />}
                {activeTab === 'inventory' && <Inventory onViewItem={(it) => setViewInventoryItem(it)} inventoryItems={inventoryItems} soldCounts={{}} onAddClick={() => setActiveTab('add')} userRole={userProfile?.role} />}
                {activeTab === 'orders' && <Orders allOrders={allOrders} inventoryItems={inventoryItems} productionBatches={productionBatches} onViewOrder={(o) => setViewOrder(o)} onShowLegacyModal={() => setShowLegacyModal(true)} onCancelOrder={handleCancelOrder} onDeleteOrder={(id) => setDeleteOrderTargetId(id)} onOpenShipping={(id) => setShippingOrderId(id)} onCreateProductionBatch={() => setShowProductionModal(true)} userRole={userProfile?.role} onDataChanged={refreshAllData} />}
                {activeTab === 'outfits' && <Outfits allOrders={allOrders} inventoryItems={inventoryItems} />}
                {activeTab === 'customers' && <Customers allOrders={allOrders} onViewCustomer={(c) => setViewCustomer(c)} searchTerm={''} setSearchTerm={() => { }} />}
                {activeTab === 'financial' && <FinancialInsights inventoryItems={inventoryItems} allOrders={allOrders} userRole={userProfile?.role} />}
                {activeTab === 'add' && <AddItem onSuccess={() => setActiveTab('inventory')} onDataChanged={refreshAllData} />}
                {activeTab === 'import' && userProfile?.role === 'admin' && <SheetImport />}

                {/* Modals wired to state and handlers */}
                <InventoryDetailModal item={viewInventoryItem} onClose={() => setViewInventoryItem(null)} onOpenEdit={openEditModal} onOpenStock={openStockModal} onViewHistory={(it) => { setViewInventoryItem(null); setHistoryItemId(it.id); }} onDelete={handleDeleteItem} />
                <OrderDetailModal order={viewOrder} onClose={() => setViewOrder(null)} onEdit={(o) => { setViewOrder(null); setShowLegacyModal(true); setLegacyForm({ orderNumber: o.orderNumber, customerName: o.customerName, outfitName: o.outfitName, size: o.size, fabricId: o.fabricId || '' }) }} onShip={(o) => { setShippingOrderId(o.id); }} />
                <CustomerDetailModal customer={viewCustomer} onClose={() => setViewCustomer(null)} allOrders={allOrders} inventoryItems={inventoryItems} userRole={userProfile?.role} />
                <LegacyOrderModal visible={showLegacyModal} onClose={() => setShowLegacyModal(false)} inventoryItems={inventoryItems} onDataChanged={refreshAllData} />
                <StockAdjustModal item={stockAdjustItem} type={stockAdjustType} onClose={() => { setStockAdjustItem(null); setStockAdjustType(null); }} onDataChanged={refreshAllData} userProfile={userProfile} />
                <EditItemModal item={editingId ? inventoryItems.find(i => i.id === editingId) : null} inventoryItems={inventoryItems} db={db} onClose={() => setEditingId(null)} onDataChanged={refreshAllData} />
                <DeleteConfirmModal visible={!!deleteOrderTargetId} orderId={deleteOrderTargetId} onClose={() => { setDeleteOrderTargetId(null); }} />
                <ShippingModal visible={!!shippingOrderId} orderId={shippingOrderId} onClose={() => setShippingOrderId(null)} />
                <ImageModal url={selectedImageUrl} onClose={() => setSelectedImageUrl(null)} />
                <HistoryModal itemId={historyItemId} onClose={() => setHistoryItemId(null)} />
                <ProductionModal visible={showProductionModal} onClose={() => setShowProductionModal(false)} inventoryItems={inventoryItems} onDataChanged={refreshAllData} />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 sm:px-4 py-2 sm:py-3 flex justify-around items-center shadow-lg safe-area-inset-bottom">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id
                    const isAddTab = tab.id === 'add'

                    return isAddTab ? (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-600 text-white flex items-center justify-center shadow-xl hover:bg-green-700 active:bg-green-700 transition -mt-8 border-4 border-gray-50"
                        >
                            <tab.icon className="w-6 h-6" />
                        </button>
                    ) : (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-1 py-2 px-2 sm:px-3 rounded-xl transition min-w-[60px] ${isActive
                                ? 'text-green-600 bg-green-50'
                                : 'text-gray-500 active:text-gray-700 active:bg-gray-50'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="text-[10px] sm:text-xs font-medium">{tab.label}</span>
                        </button>
                    )
                })}
            </nav>
        </div>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <InnerApp />
        </AuthProvider>
    )
}


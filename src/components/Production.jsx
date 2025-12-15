import React, { useMemo, useState } from 'react'
import { Scissors, Package, TrendingUp, AlertCircle } from 'lucide-react'

export default function Production({ productionBatches = [], inventoryItems = [], onCreateBatch }) {
    const [filter, setFilter] = useState('all') // all, completed, in-progress

    const stats = useMemo(() => {
        const totalBatches = productionBatches.length
        const totalPieces = productionBatches.reduce((sum, b) => sum + (b.totalPieces || 0), 0)
        const totalFabricUsed = productionBatches.reduce((sum, b) => sum + (parseFloat(b.fabricUsed) || 0), 0)
        const totalStitchingCost = productionBatches.reduce((sum, b) => sum + (parseFloat(b.stitchingCostTotal) || 0), 0)
        const avgCostPerPiece = totalPieces > 0 ?
            productionBatches.reduce((sum, b) => sum + ((b.totalCostPerPiece || 0) * (b.totalPieces || 0)), 0) / totalPieces : 0

        return {
            totalBatches,
            totalPieces,
            totalFabricUsed,
            totalStitchingCost,
            avgCostPerPiece
        }
    }, [productionBatches])

    // Low stock alerts - outfits with stock < 5 total pieces
    const lowStockOutfits = useMemo(() => {
        return inventoryItems
            .filter(item => item.type === 'outfit')
            .map(item => {
                const totalStock = Object.values(item.stockBreakdown || {})
                    .reduce((sum, val) => sum + (parseInt(val) || 0), 0)
                return { ...item, totalStock }
            })
            .filter(item => item.totalStock < 5)
            .sort((a, b) => a.totalStock - b.totalStock)
    }, [inventoryItems])

    // Fabric suggestions for production
    const fabricSuggestions = useMemo(() => {
        return inventoryItems
            .filter(item => item.type === 'fabric' && parseFloat(item.currentLength) > 10)
            .map(fabric => {
                const lengthAvailable = parseFloat(fabric.currentLength) || 0
                const avgFabricPerPiece = 1.1 // Approximate, can be calculated from history
                const potentialPieces = Math.floor(lengthAvailable / avgFabricPerPiece)
                return { ...fabric, lengthAvailable, potentialPieces }
            })
            .sort((a, b) => b.lengthAvailable - a.lengthAvailable)
    }, [inventoryItems])

    const sortedBatches = useMemo(() => {
        return [...productionBatches].sort((a, b) => {
            const dateA = a.receivedDate?.toDate ? a.receivedDate.toDate() : new Date(a.receivedDate)
            const dateB = b.receivedDate?.toDate ? b.receivedDate.toDate() : new Date(b.receivedDate)
            return dateB - dateA
        })
    }, [productionBatches])

    const formatDate = (date) => {
        if (!date) return 'N/A'
        const d = date.toDate ? date.toDate() : new Date(date)
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <div className="space-y-6 fade-in pb-20">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900
                <button
                    onClick={onCreateBatch}
                    className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
                >
                    <Scissors className="w-4 h-4" />
                    New Batch
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-2xl shadow-card text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5" />
                        <p className="text-xs opacity-90">Total Batches</p>
                    </div>
                    <p className="text-2xl font-bold">{stats.totalBatches}</p>
                    <p className="text-xs opacity-80 mt-1">{stats.totalPieces} pieces produced</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-2xl shadow-card text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <p className="text-xs opacity-90">Avg Cost/Piece</p>
                    </div>
                    <p className="text-2xl font-bold">₹{stats.avgCostPerPiece.toFixed(0)}</p>
                    <p className="text-xs opacity-80 mt-1">Production cost</p>
                </div>
            </div>

            {/* Low Stock Alerts */}
            {lowStockOutfits.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <h3 className="font-bold text-orange-900">Low Stock Alert</h3>
                    </div>
                    <div className="space-y-2">
                        {lowStockOutfits.map((outfit, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-orange-800">{outfit.name}</span>
                                <span className="font-bold text-orange-900">{outfit.totalStock} left</span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={onCreateBatch}
                        className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-bold"
                    >
                        Create Production Batch
                    </button>
                </div>
            )}

            {/* Fabric Suggestions */}
            {fabricSuggestions.length > 0 && (
                <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl shadow-card border dark:border-gray-800 border dark:border-gray-800">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">Available Fabric for Production</h3>
                    <div className="space-y-2">
                        {fabricSuggestions.slice(0, 5).map((fabric, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{fabric.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 available</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-brand">~{fabric.potentialPieces} pieces</p>
                                    <p className="text-xs text-gray-500">
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Production Batches List */}
            <div className="bg-white p-5 rounded-2xl shadow-card border dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Production History</h3>
                <div className="space-y-3">
                    {sortedBatches.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <Scissors className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>No production batches yet</p>
                            <button
                                onClick={onCreateBatch}
                                className="mt-4 bg-brand text-white px-6 py-2 rounded-xl font-bold"
                            >
                                Create First Batch
                            </button>
                        </div>
                    ) : (
                        sortedBatches.map((batch, idx) => (
                            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50">
                                <div className="flex gap-3">
                                    {batch.outfitImageUrl && (
                                        <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                            <img src={batch.outfitImageUrl} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{batch.outfitName}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 {batch.fabricName}</p>
                                        <div className="flex gap-3 mt-2 text-xs">
                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                {batch.totalPieces} pcs
                                            </span>
                                            <span className="bg-gray-100 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                                {batch.fabricUsed}m used
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white || 0).toFixed(0)}/pc</p>
                                        <p className="text-xs text-gray-500">
                                    </div>
                                </div>

                                {/* Size Breakdown */}
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2 text-xs">
                                    {Object.entries(batch.sizeBreakdown || {}).map(([size, qty]) => (
                                        qty > 0 && (
                                            <span key={size} className="bg-green-50 text-green-700 px-2 py-1 rounded">
                                                {size}: {qty}
                                            </span>
                                        )
                                    ))}
                                </div>

                                {/* Tailor & Notes */}
                                {(batch.tailorName || batch.notes) && (
                                    <div className="mt-2 text-xs text-gray-600
                                        {batch.tailorName && <p>👔 {batch.tailorName}</p>}
                                        {batch.notes && <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 italic mt-1">{batch.notes}</p>}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

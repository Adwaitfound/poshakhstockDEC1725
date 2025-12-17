import React, { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'

export default function Dashboard({ allOrders = [], inventoryItems = [], userRole = 'admin' }) {
    const [financialViewMode, setFinancialViewMode] = useState('all')

    const cleanNumber = (val) => {
        const n = parseFloat(val)
        return isNaN(n) ? 0 : n
    }

    const getOutfitTotal = (breakdown) => {
        if (!breakdown) return 0
        return Object.values(breakdown).reduce((a, b) => a + (parseInt(b) || 0), 0)
    }

    const calculateOutfitMakingCost = (outfit, inventory) => {
        if (!outfit.parentFabricId) return 0
        const parent = inventory.find(i => i.id === outfit.parentFabricId)
        if (!parent) return 0
        const fabricCost = (parseFloat(parent.costPerMeter) || 0) * (parseFloat(outfit.lengthRequiredPerOutfit) || 0)
        const stitching = parseFloat(outfit.stitchingCost) || 0
        return fabricCost + stitching
    }

    const inventoryStats = useMemo(() => {
        let potentialRevenue = 0
        let totalStockCount = 0
        let totalFabricCostValuation = 0
        let totalOutfitCostValuation = 0

        inventoryItems.forEach(item => {
            if (item.type === 'outfit') {
                const qty = getOutfitTotal(item.stockBreakdown)
                totalStockCount += qty
                potentialRevenue += qty * (item.sellingPrice || 0)
                const unitCost = calculateOutfitMakingCost(item, inventoryItems)
                totalOutfitCostValuation += qty * unitCost
            } else if (item.type === 'fabric') {
                const currentLength = parseFloat(item.currentLength) || 0
                const costPerMeter = parseFloat(item.costPerMeter) || 0
                const lengthPerOutfit = parseFloat(item.lengthRequiredPerOutfit) || 1
                const sellPrice = parseFloat(item.sellingPrice) > 0 ? parseFloat(item.sellingPrice) : 1500

                totalFabricCostValuation += currentLength * costPerMeter
                const potentialOutfits = Math.floor(currentLength / (lengthPerOutfit > 0 ? lengthPerOutfit : 1))
                potentialRevenue += potentialOutfits * sellPrice
            }
        })

        const totalStockValuation = totalFabricCostValuation + totalOutfitCostValuation
        const potentialProfit = potentialRevenue - totalStockValuation
        const percentageIncrease = totalStockValuation > 0 ? (potentialProfit / totalStockValuation) * 100 : 0

        return {
            potentialRevenue,
            totalStockCount,
            totalFabricCostValuation,
            totalOutfitCostValuation,
            totalStockValuation,
            percentageIncrease,
            totalPotentialRevenue: potentialRevenue,
            totalStockValue: totalStockValuation,
            revenuePerMeter: totalStockCount > 0 ? potentialRevenue / totalStockCount : 0
        }
    }, [inventoryItems])

    const financialMetrics = useMemo(() => {
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()

        const relevantOrders = allOrders.filter(o => {
            if (o.status === 'Cancelled') return false

            if (financialViewMode === 'month') {
                let dateObj = null
                if (o.createdAt?.toDate) {
                    dateObj = o.createdAt.toDate()
                } else if (o.dateString) {
                    dateObj = new Date(o.dateString)
                }
                if (!dateObj || isNaN(dateObj.getTime())) return false
                return dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear
            }
            return true
        })

        let totalRevenue = 0
        let totalSold = 0
        let totalProfit = 0
        let dailyProfit = 0
        let totalFabricUsed = 0
        let expenseFabric = 0
        let expenseStitching = 0
        let expenseShipping = 0
        let expenseCOD = 0
        let countCOD = 0
        let countPrepaid = 0
        const customerRevenue = {}

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        relevantOrders.forEach(order => {
            const fabric = inventoryItems.find(i => i.id === order.fabricId) || { costPerMeter: 0 }
            const cutAmt = parseFloat(order.cutAmount) || 0
            const matCost = cutAmt * (parseFloat(fabric.costPerMeter) || 0)
            const stitch = cleanNumber(order.stitchingCost)
            const acq = cleanNumber(order.acquisitionCost) || cleanNumber(order.codCharge)
            const ship = cleanNumber(order.shippingCost)
            const other = cleanNumber(order.otherExpenses)
            const revenue = cleanNumber(order.finalSellingPrice) || cleanNumber(order.orderTotal)

            if (revenue > 0 || order.status === 'Order Shipped (Completed)') {
                totalRevenue += revenue
                totalSold++
                totalFabricUsed += cutAmt
                expenseFabric += matCost
                expenseStitching += stitch
                expenseShipping += ship
                expenseCOD += acq + other

                const profit = (revenue - matCost - stitch - acq - ship - other)
                totalProfit += profit

                if (order.createdAt && typeof order.createdAt.toDate === 'function' && order.createdAt.toDate() >= todayStart) {
                    dailyProfit += profit
                }

                const method = (order.paymentMethod || '').toLowerCase()
                if (method.includes('cod') || method.includes('cash')) countCOD++
                else countPrepaid++

                // Track customer revenue
                if (order.customerName) {
                    const customerKey = order.customerName.toLowerCase().trim()
                    if (!customerRevenue[customerKey]) {
                        customerRevenue[customerKey] = { name: order.customerName, revenue: 0, orders: 0 }
                    }
                    customerRevenue[customerKey].revenue += revenue
                    customerRevenue[customerKey].orders++
                }
            }
        })

        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
        const revPerMeter = totalFabricUsed > 0 ? totalRevenue / totalFabricUsed : 0

        // Get top customers by revenue
        const topCustomers = Object.values(customerRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)

        const uniqueCustomerCount = Object.keys(customerRevenue).length
        const avgCustomerRevenue = uniqueCustomerCount > 0 ? totalRevenue / uniqueCustomerCount : 0

        return {
            totalRevenue: totalRevenue.toFixed(0),
            totalProfit: totalProfit.toFixed(0),
            netProfit: parseInt(totalProfit),
            totalSold,
            dailyProfit,
            revPerMeter: revPerMeter.toFixed(0),
            profitMargin: profitMargin.toFixed(1),
            breakdown: {
                fabric: expenseFabric,
                stitch: expenseStitching,
                ship: expenseShipping,
                cod: expenseCOD,
                ops: expenseCOD + expenseShipping
            },
            paymentSplit: { cod: countCOD, prepaid: countPrepaid },
            customerMetrics: {
                totalCustomers: uniqueCustomerCount,
                avgRevenue: avgCustomerRevenue,
                topCustomers
            }
        }
    }, [inventoryItems, allOrders, financialViewMode])

    return (
        <>
            {userRole === 'admin' && (
                <div className="flex justify-end mb-6">
                    <div className="bg-transparent p-1 rounded-3xl flex text-xs font-bold shadow-sm border-3 border-lime-glow">
                        <button onClick={() => setFinancialViewMode('all')} className={`px-5 py-2 rounded-2xl transition-all font-semibold ${financialViewMode === 'all' ? 'bg-emerald-pine text-lime-glow shadow-lg' : 'text-emerald-pine/60 hover:text-emerald-pine'}`}>All Time</button>
                        <button onClick={() => setFinancialViewMode('month')} className={`px-5 py-2 rounded-2xl transition-all font-semibold ${financialViewMode === 'month' ? 'bg-emerald-pine text-lime-glow shadow-lg' : 'text-emerald-pine/60 hover:text-emerald-pine'}`}>This Month</button>
                    </div>
                </div>
            )}

            {/* Main Balance Card - Full Width */}
            <div className="mb-6">
                <div className="bg-lime-glow p-8 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-xs text-emerald-pine mb-3 font-medium uppercase tracking-wider">Your Current Balance</p>
                            {userRole === 'admin' ? (
                                <h3 className="text-5xl font-bold mb-4 text-emerald-pine">₹{parseInt(financialMetrics.totalRevenue).toLocaleString()}</h3>
                            ) : (
                                <h3 className="text-5xl font-bold mb-4 text-emerald-pine">{financialMetrics.totalSold}</h3>
                            )}
                            <p className="text-base text-emerald-pine/80">{financialMetrics.totalSold} Orders</p>
                        </div>
                        <div className="flex flex-col justify-end text-right">
                            {userRole === 'admin' && (
                                <>
                                    <p className="text-4xl font-bold text-emerald-pine mb-2">₹{financialMetrics.netProfit.toLocaleString()}</p>
                                    <p className="text-sm text-emerald-pine/80">Net Profit ({financialMetrics.profitMargin}%)</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics - 4 Cards Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-lime-glow p-4 rounded-3xl shadow-lg border-2 border-lime-glow">
                    <p className="text-xs text-emerald-pine font-semibold uppercase mb-2">Daily Profit</p>
                    <p className="text-2xl font-bold text-emerald-pine">₹{(financialMetrics.netProfit / 30).toFixed(0)}</p>
                </div>
                <div className="bg-lime-glow p-4 rounded-3xl shadow-lg border-2 border-lime-glow">
                    <p className="text-xs text-emerald-pine font-semibold uppercase mb-2">Rev / Meter</p>
                    <p className="text-2xl font-bold text-emerald-pine">₹{inventoryStats.revenuePerMeter.toLocaleString()}</p>
                </div>
                <div className="bg-lime-glow p-4 rounded-3xl shadow-lg border-2 border-lime-glow">
                    <p className="text-xs text-emerald-pine font-semibold uppercase mb-2">Potential Rev</p>
                    <p className="text-2xl font-bold text-emerald-pine">₹{(inventoryStats.totalPotentialRevenue / 1000).toFixed(1)}k</p>
                    <p className="text-[10px] font-bold text-emerald-pine/80 mt-1">+{inventoryStats.percentageIncrease.toFixed(0)}% ROI</p>
                </div>
                <div className="bg-lime-glow p-4 rounded-3xl shadow-lg border-2 border-lime-glow">
                    <p className="text-xs text-emerald-pine font-semibold uppercase mb-2">Stock Value</p>
                    <p className="text-2xl font-bold text-emerald-pine">₹{(inventoryStats.totalStockValue / 1000).toFixed(1)}k</p>
                    <div className="flex gap-2 text-[9px] mt-1 text-emerald-pine/70">
                        <span>Fab: {(inventoryStats.totalFabricCostValuation / 1000).toFixed(1)}k</span>
                        <span>|</span>
                        <span>Out: {(inventoryStats.totalOutfitCostValuation / 1000).toFixed(1)}k</span>
                    </div>
                </div>
            </div>

            {/* Expense and Payment Info - 2 Cards Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-lime-glow p-5 rounded-3xl shadow-lg border-2 border-lime-glow">
                    <p className="text-xs text-emerald-pine font-semibold uppercase mb-3">Expenses Breakdown</p>
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between"><span className="text-emerald-pine/80">Fabric</span> <span className="font-bold text-emerald-pine">₹{(financialMetrics.breakdown.fabric / 1000).toFixed(1)}k</span></div>
                        <div className="flex justify-between"><span className="text-emerald-pine/80">Stitch</span> <span className="font-bold text-emerald-pine">₹{(financialMetrics.breakdown.stitch / 1000).toFixed(1)}k</span></div>
                        <div className="flex justify-between"><span className="text-emerald-pine/80">Ship</span> <span className="font-bold text-emerald-pine">₹{(financialMetrics.breakdown.ship / 1000).toFixed(1)}k</span></div>
                        <div className="border-t border-emerald-pine/30 pt-2 flex justify-between"><span className="text-emerald-pine font-semibold">COD/Acq</span> <span className="font-bold text-emerald-pine">₹{(financialMetrics.breakdown.cod / 1000).toFixed(1)}k</span></div>
                    </div>
                </div>
                <div className="bg-lime-glow p-5 rounded-3xl shadow-lg border-2 border-lime-glow">
                    <p className="text-xs text-emerald-pine font-semibold uppercase mb-3">Payment Split</p>
                    <div className="flex items-center justify-around h-24">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-emerald-pine">{financialMetrics.paymentSplit.cod}</p>
                            <p className="text-xs text-emerald-pine/70 mt-1">COD</p>
                        </div>
                        <div className="w-px h-12 bg-emerald-pine/30"></div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-emerald-pine">{financialMetrics.paymentSplit.prepaid}</p>
                            <p className="text-xs text-emerald-pine/70 mt-1">Prepaid</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer Metrics */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-lime-glow p-5 rounded-3xl shadow-lg border-2 border-lime-glow">
                    <p className="text-xs text-emerald-pine font-semibold uppercase mb-3">Customer Metrics</p>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold text-emerald-pine">{financialMetrics.customerMetrics.totalCustomers}</p>
                            <p className="text-[10px] text-emerald-pine/70 mt-1">Total Customers</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-pine">₹{(financialMetrics.customerMetrics.avgRevenue / 1000).toFixed(1)}k</p>
                            <p className="text-[10px] text-emerald-pine/70 mt-1">Avg Revenue</p>
                        </div>
                    </div>
                </div>
                <div className="bg-emerald-pine p-5 rounded-3xl shadow-lg border-2 border-lime-glow">
                    <p className="text-xs text-lime-glow font-semibold uppercase mb-1">⭐ Top Customer</p>
                    {financialMetrics.customerMetrics.topCustomers.length > 0 ? (
                        <div>
                            <p className="text-lg font-bold text-lime-glow mt-2">{financialMetrics.customerMetrics.topCustomers[0].name}</p>
                            <p className="text-2xl font-bold text-lime-glow mt-1">₹{(financialMetrics.customerMetrics.topCustomers[0].revenue / 1000).toFixed(1)}k</p>
                            <p className="text-xs text-lime-glow/80 mt-2">{financialMetrics.customerMetrics.topCustomers[0].orders} orders</p>
                        </div>
                    ) : (
                        <p className="text-xs text-lime-glow/50 mt-2">No customers yet</p>
                    )}
                </div>
            </div>
        </>
    )
}

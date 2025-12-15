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
            percentageIncrease
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
                <div className="flex justify-end mb-4">
                    <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-bold">
                        <button onClick={() => setFinancialViewMode('all')} className={`px-3 py-1 rounded-md ${financialViewMode === 'all' ? 'bg-white shadow text-gray-900 dark:text-white : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400'}`}>All Time</button>
                        <button onClick={() => setFinancialViewMode('month')} className={`px-3 py-1 rounded-md ${financialViewMode === 'month' ? 'bg-white shadow text-gray-900 dark:text-white : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400'}`}>This Month</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand text-white p-5 rounded-3xl shadow-soft flex flex-col justify-between h-40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <TrendingUp className="w-12 h-12" />
                    </div>
                    <div>
                        {userRole === 'admin' ? (
                            <>
                                <h3 className="text-2xl font-bold">₹{parseInt(financialMetrics.totalRevenue).toLocaleString()}</h3>
                                <p className="text-brand-100 text-xs font-medium mt-1">Total Revenue</p>
                            </>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold">{financialMetrics.totalSold}</h3>
                                <p className="text-brand-100 text-xs font-medium mt-1">Total Orders</p>
                            </>
                        )}
                        <p className="text-[10px] text-brand-200 mt-1">{financialMetrics.totalSold} Orders</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-950 p-5 rounded-3xl shadow-soft flex flex-col justify-between h-40 border dark:border-gray-800 border dark:border-gray-800">
                    <div>
                        {userRole === 'admin' ? (
                            <>
                                <h3 className="text-2xl font-bold text-gray-900
                                <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">Net Profit</p>
                                <div className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 space-y-1">
                                    <p className="text-green-600 font-bold">{financialMetrics.profitMargin}% Margin</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-2xl font-bold text-gray-900
                                <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">Total Customers</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {userRole === 'admin' && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-950 p-4 rounded-3xl shadow-soft flex flex-col justify-center border dark:border-gray-800 border dark:border-gray-800">
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Daily Profit</p>
                            <p className="text-xl font-bold text-gray-800
                        </div>
                        <div className="bg-white dark:bg-gray-950 p-4 rounded-3xl shadow-soft flex flex-col justify-center border dark:border-gray-800 border dark:border-gray-800">
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Rev / Meter</p>
                            <p className="text-xl font-bold text-gray-800
                        </div>
                        <div className="bg-white dark:bg-gray-950 p-4 rounded-3xl shadow-soft flex flex-col justify-center border dark:border-gray-800 border dark:border-gray-800">
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Potential Rev</p>
                            <p className="text-xl font-bold text-gray-800
                            <p className="text-[10px] font-bold text-green-600 mt-1">+{inventoryStats.percentageIncrease.toFixed(0)}% Potential ROI</p>
                        </div>
                        <div className="bg-white dark:bg-gray-950 p-4 rounded-3xl shadow-soft flex flex-col justify-center border dark:border-gray-800 border dark:border-gray-800">
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Stock Value</p>
                            <p className="text-xl font-bold text-gray-800
                            <div className="flex gap-2 text-[9px] mt-1 text-gray-500">
                                <span>Fab: {(inventoryStats.totalFabricCostValuation / 1000).toFixed(1)}k</span>
                                <span>|</span>
                                <span>Out: {(inventoryStats.totalOutfitCostValuation / 1000).toFixed(1)}k</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-950 p-4 rounded-3xl shadow-soft border dark:border-gray-800 border dark:border-gray-800">
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Expenses</p>
                            <div className="text-[10px] space-y-1">
                                <div className="flex justify-between"><span>Fabric:</span> <span className="font-bold">₹{(financialMetrics.breakdown.fabric / 1000).toFixed(1)}k</span></div>
                                <div className="flex justify-between"><span>Stitch:</span> <span className="font-bold">₹{(financialMetrics.breakdown.stitch / 1000).toFixed(1)}k</span></div>
                                <div className="flex justify-between"><span>Ship:</span> <span className="font-bold">₹{(financialMetrics.breakdown.ship / 1000).toFixed(1)}k</span></div>
                                <div className="flex justify-between text-orange-600"><span>COD/Acq:</span> <span className="font-bold">₹{(financialMetrics.breakdown.cod / 1000).toFixed(1)}k</span></div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-3xl shadow-soft border dark:border-gray-800">
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Payment Split</p>
                            <div className="flex items-center justify-center h-20">
                                <div className="text-center">
                                    <p className="text-xl font-bold text-gray-800 dark:text-white <span className="text-xs font-normal text-gray-400">COD</span></p>
                                    <p className="text-xl font-bold text-gray-800 dark:text-white <span className="text-xs font-normal text-gray-400">Prepaid</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-3xl shadow-soft border dark:border-gray-800">
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Customer Metrics</p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xl font-bold text-gray-800
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 Customers</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">₹{(financialMetrics.customerMetrics.avgRevenue / 1000).toFixed(1)}k</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 Revenue</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-3xl shadow-soft">
                            <p className="text-xs text-purple-700 font-bold uppercase mb-2">Top Customer</p>
                            {financialMetrics.customerMetrics.topCustomers.length > 0 ? (
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{financialMetrics.customerMetrics.topCustomers[0].name}</p>
                                    <p className="text-xl font-bold text-purple-600">₹{(financialMetrics.customerMetrics.topCustomers[0].revenue / 1000).toFixed(1)}k</p>
                                    <p className="text-[10px] text-gray-600 dark:text-gray-400 dark:text-gray-500 orders</p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400">No customers yet</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

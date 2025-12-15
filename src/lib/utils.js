export const FABRICS_COLLECTION = 'fabrics'
export const ORDERS_COLLECTION = 'production_orders'
export const CUSTOMERS_COLLECTION = 'customers'
export const AVERAGE_SELLING_PRICE = 1200

export const ALLOWED_USERS = [
    { id: 1, name: 'Adwait', designation: 'Owner' },
    { id: 2, name: 'Avani', designation: 'Owner' },
    { id: 3, name: 'Binay', designation: 'Staff' }
]

export const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
})

export const cleanNumber = (val) => {
    if (typeof val === 'number') return val
    if (!val) return 0
    const strVal = val.toString()
    const cleaned = strVal.replace(/[^0-9.-]/g, '')
    return parseFloat(cleaned) || 0
}

export const getOutfitTotal = (breakdown) => Object.values(breakdown || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)

export const calculateOutfitMakingCost = (outfit, allItems) => {
    const stitch = parseFloat(outfit?.stitchingCost) || 0
    let fabricCost = 0
    const reqLength = parseFloat(outfit?.lengthRequiredPerOutfit) || 0
    if (outfit?.parentFabricId && reqLength > 0) {
        const parent = allItems.find(f => f.id === outfit.parentFabricId)
        if (parent) {
            fabricCost = (parseFloat(parent.costPerMeter) || 0) * reqLength
        }
    }
    return stitch + fabricCost
}

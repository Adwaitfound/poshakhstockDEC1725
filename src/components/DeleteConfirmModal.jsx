import React, { useState } from 'react'
import { getDb } from '../firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { ORDERS_COLLECTION } from '../lib/utils'

export default function DeleteConfirmModal({ visible, orderId, onClose }) {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    if (!visible || !orderId) return null

    const handleDelete = async () => {
        if (password !== 'posh123') {
            setError("Incorrect Password!")
            return
        }

        setIsDeleting(true)
        setError('')

        try {
            const db = getDb()
            await deleteDoc(doc(db, ORDERS_COLLECTION, orderId))
            setPassword('')
            onClose()
        } catch (e) {
            console.error(e)
            setError("Delete failed: " + e.message)
        }
        setIsDeleting(false)
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center modal-enter backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl p-6 pb-8 shadow-2xl border dark:border-gray-800 border dark:border-gray-800">
                <h3 className="text-lg font-bold mb-4 text-red-600 flex items-center gap-2">
                    <span>🗑️</span> Delete Record?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4">Enter admin password to permanently delete this order history.</p>
                {error && (
                    <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>
                )}
                <input
                    type="password"
                    className="w-full p-3 border rounded-xl mb-4"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                    disabled={isDeleting}
                />
                <div className="flex gap-3">
                    <button onClick={handleDelete} disabled={isDeleting} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold">
                        Delete
                    </button>
                    <button onClick={() => { setPassword(''); onClose(); }} disabled={isDeleting} className="flex-1 bg-gray-100 text-gray-600 dark:text-gray-400 dark:text-gray-500 py-3 rounded-xl font-bold">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

package com.tollsplit.costmanagement.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.tollsplit.costmanagement.data.model.Transaction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext

class TransactionRepository(private val db: FirebaseFirestore = FirebaseFirestore.getInstance()) {

    fun getTransactionsFlow(groupId: String, limitCount: Int = 50): Flow<List<Transaction>> = callbackFlow {
        if (groupId.isEmpty()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val listener = db.collection("transactions")
            .whereEqualTo("group_id", groupId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val transactions = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Transaction::class.java)?.copy(id = doc.id)
                }?.sortedByDescending { it.created_at?.time ?: 0L }?.take(limitCount) ?: emptyList()
                trySend(transactions)
            }
        awaitClose { listener.remove() }
    }

    suspend fun getTransactions(groupId: String, limitCount: Int = 50): List<Transaction> = withContext(Dispatchers.IO) {
        if (groupId.isEmpty()) return@withContext emptyList()
        val snapshot = db.collection("transactions")
            .whereEqualTo("group_id", groupId)
            .get()
            .await()
        snapshot.documents.mapNotNull { doc ->
            doc.toObject(Transaction::class.java)?.copy(id = doc.id)
        }.sortedByDescending { it.created_at?.time ?: 0L }.take(limitCount)
    }
}

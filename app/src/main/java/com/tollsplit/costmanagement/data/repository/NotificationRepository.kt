package com.tollsplit.costmanagement.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.SetOptions
import com.tollsplit.costmanagement.data.model.AppNotification
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.Date

class NotificationRepository(private val db: FirebaseFirestore = FirebaseFirestore.getInstance()) {

    fun observeLatestNotification(): Flow<AppNotification?> = callbackFlow {
        val listener = db.collection("notifications")
            .orderBy("created_at", Query.Direction.DESCENDING)
            .limit(1)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val notif = snapshot?.documents?.firstOrNull()?.let { doc ->
                    doc.toObject(AppNotification::class.java)?.copy(id = doc.id)
                }
                trySend(notif)
            }
        awaitClose { listener.remove() }
    }

    suspend fun sendNotification(message: String): String {
        val notifRef = db.collection("notifications").document()
        val data = hashMapOf(
            "message" to message,
            "created_at" to Date()
        )
        notifRef.set(data).await()
        return notifRef.id
    }

    suspend fun registerPushToken(token: String) {
        val tokenRef = db.collection("push_tokens").document(token)
        val data = hashMapOf(
            "token" to token,
            "updated_at" to Date()
        )
        tokenRef.set(data, SetOptions.merge()).await()
    }
}

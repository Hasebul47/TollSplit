package com.tollsplit.costmanagement.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.tollsplit.costmanagement.data.model.Member
import com.tollsplit.costmanagement.data.model.Trip
import com.tollsplit.costmanagement.utils.ColorUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.Date
import kotlin.math.abs

data class MemberStats(
    val spent: Double = 0.0,
    val deposited: Double = 0.0,
    val tripCount: Int = 0
)

class MemberRepository(private val db: FirebaseFirestore = FirebaseFirestore.getInstance()) {

    fun getMembersFlow(groupId: String): Flow<List<Member>> = callbackFlow {
        if (groupId.isEmpty()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val listener = db.collection("members")
            .whereEqualTo("group_id", groupId)
            .whereEqualTo("is_active", true)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val members = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Member::class.java)?.copy(id = doc.id)
                }?.sortedBy { it.name.lowercase() } ?: emptyList()
                trySend(members)
            }
        awaitClose { listener.remove() }
    }

    suspend fun getMembers(groupId: String): List<Member> = withContext(Dispatchers.IO) {
        if (groupId.isEmpty()) return@withContext emptyList()
        val snapshot = db.collection("members")
            .whereEqualTo("group_id", groupId)
            .whereEqualTo("is_active", true)
            .get()
            .await()
        snapshot.documents.mapNotNull { doc ->
            doc.toObject(Member::class.java)?.copy(id = doc.id)
        }.sortedBy { it.name.lowercase() }
    }

    suspend fun addMember(groupId: String, name: String, phone: String, initialDeposit: Double = 0.0): String = withContext(Dispatchers.IO) {
        val memberRef = db.collection("members").document()
        val memberId = memberRef.id
        val avatarColor = ColorUtils.getRandomAvatarColor()

        val batch = db.batch()
        val memberData = hashMapOf(
            "group_id" to groupId,
            "name" to name,
            "phone" to phone,
            "balance" to initialDeposit,
            "avatar_color" to avatarColor,
            "is_active" to true,
            "created_at" to Date()
        )
        batch.set(memberRef, memberData)

        if (initialDeposit > 0) {
            val txRef = db.collection("transactions").document()
            val txData = hashMapOf(
                "group_id" to groupId,
                "member_id" to memberId,
                "type" to "deposit",
                "amount" to initialDeposit,
                "note" to "Initial deposit",
                "created_at" to Date(),
                "member_name" to name,
                "avatar_color" to avatarColor
            )
            batch.set(txRef, txData)
        }

        batch.commit().await()
        memberId
    }

    suspend fun updateMember(id: String, name: String, phone: String) = withContext(Dispatchers.IO) {
        val updates = hashMapOf<String, Any>(
            "name" to name,
            "phone" to phone
        )
        db.collection("members").document(id).update(updates).await()
    }

    suspend fun deactivateMember(id: String) = withContext(Dispatchers.IO) {
        db.collection("members").document(id).update("is_active", false).await()
    }

    suspend fun addDeposit(groupId: String, memberId: String, amount: Double, note: String, type: String = "deposit") = withContext(Dispatchers.IO) {
        val memberRef = db.collection("members").document(memberId)
        val actualAmount = if (type == "deduction") -abs(amount) else abs(amount)

        db.runTransaction { transaction ->
            val memberSnap = transaction.get(memberRef)
            if (!memberSnap.exists()) {
                throw IllegalStateException("Member does not exist!")
            }

            val currentBalance = memberSnap.getDouble("balance") ?: 0.0
            val newBalance = currentBalance + actualAmount
            val name = memberSnap.getString("name") ?: ""
            val avatarColor = memberSnap.getString("avatar_color") ?: "#10b981"

            // Update balance
            transaction.update(memberRef, "balance", newBalance)

            // Record transaction
            val txRef = db.collection("transactions").document()
            val txData = hashMapOf(
                "group_id" to groupId,
                "member_id" to memberId,
                "type" to type,
                "amount" to abs(actualAmount),
                "note" to note.ifBlank { if (type == "deposit") "Manual deposit" else "Manual deduction" },
                "created_at" to Date(),
                "member_name" to name,
                "avatar_color" to avatarColor
            )
            transaction.set(txRef, txData)
            null
        }.await()
    }

    suspend fun getMemberStats(memberId: String): MemberStats = withContext(Dispatchers.IO) {
        if (memberId.isEmpty()) return@withContext MemberStats()
        try {
            // Fetch deposits and trips in parallel on IO threads
            val txDeferred = async {
                db.collection("transactions")
                    .whereEqualTo("member_id", memberId)
                    .whereEqualTo("type", "deposit")
                    .get()
                    .await()
            }
            val tripsDeferred = async {
                db.collection("trips")
                    .whereArrayContains("member_ids", memberId)
                    .get()
                    .await()
            }

            val txSnap = txDeferred.await()
            val tripsSnap = tripsDeferred.await()

            val totalDeposits = txSnap.documents.sumOf { (it.getDouble("amount") ?: 0.0) }

            var totalSpent = 0.0
            var tripCount = 0

            for (doc in tripsSnap.documents) {
                val trip = doc.toObject(Trip::class.java)
                val mObj = trip?.members?.find { it.member_id == memberId }
                if (mObj != null) {
                    totalSpent += mObj.cost_share
                    tripCount++
                }
            }

            MemberStats(
                spent = totalSpent,
                deposited = totalDeposits,
                tripCount = tripCount
            )
        } catch (e: Exception) {
            MemberStats()
        }
    }
}

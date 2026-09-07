package com.tollsplit.costmanagement.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.tollsplit.costmanagement.data.model.Group
import com.tollsplit.costmanagement.utils.DateUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.Date

data class GroupStats(
    val totalBalance: Double = 0.0,
    val totalSpent: Double = 0.0,
    val totalDeposited: Double = 0.0,
    val memberCount: Int = 0,
    val tripCount: Int = 0,
    val todayTrips: Int = 0
)

class GroupRepository(private val db: FirebaseFirestore = FirebaseFirestore.getInstance()) {

    fun getGroupsFlow(): Flow<List<Group>> = callbackFlow {
        val listener = db.collection("groups")
            .orderBy("name", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val groups = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Group::class.java)?.copy(id = doc.id)
                } ?: emptyList()
                trySend(groups)
            }
        awaitClose { listener.remove() }
    }

    suspend fun getGroups(): List<Group> = withContext(Dispatchers.IO) {
        val snapshot = db.collection("groups")
            .orderBy("name", Query.Direction.ASCENDING)
            .get()
            .await()
        snapshot.documents.mapNotNull { doc ->
            doc.toObject(Group::class.java)?.copy(id = doc.id)
        }
    }

    suspend fun getGroupById(id: String): Group? = withContext(Dispatchers.IO) {
        if (id.isEmpty()) return@withContext null
        val doc = db.collection("groups").document(id).get().await()
        if (doc.exists()) doc.toObject(Group::class.java)?.copy(id = doc.id) else null
    }

    suspend fun addGroup(name: String, description: String, defaultToll: Double = 80.0, defaultDeposit: Double = 300.0): String = withContext(Dispatchers.IO) {
        val groupRef = db.collection("groups").document()
        val data = hashMapOf(
            "name" to name,
            "description" to description,
            "default_toll" to defaultToll,
            "default_deposit" to defaultDeposit,
            "created_at" to Date()
        )
        groupRef.set(data).await()
        groupRef.id
    }

    suspend fun updateGroup(id: String, name: String, description: String, defaultToll: Double, defaultDeposit: Double) = withContext(Dispatchers.IO) {
        val updates = hashMapOf<String, Any>(
            "name" to name,
            "description" to description,
            "default_toll" to defaultToll,
            "default_deposit" to defaultDeposit
        )
        db.collection("groups").document(id).update(updates).await()
    }

    suspend fun deleteGroup(id: String) = withContext(Dispatchers.IO) {
        db.collection("groups").document(id).delete().await()
    }

    suspend fun getGroupStats(groupId: String): GroupStats = withContext(Dispatchers.IO) {
        if (groupId.isEmpty()) return@withContext GroupStats()
        try {
            // Fetch active members, trips, and deposits in parallel on IO threads
            val membersDeferred = async {
                db.collection("members")
                    .whereEqualTo("group_id", groupId)
                    .whereEqualTo("is_active", true)
                    .get()
                    .await()
            }
            val tripsDeferred = async {
                db.collection("trips")
                    .whereEqualTo("group_id", groupId)
                    .get()
                    .await()
            }
            val depositsDeferred = async {
                db.collection("transactions")
                    .whereEqualTo("group_id", groupId)
                    .whereEqualTo("type", "deposit")
                    .get()
                    .await()
            }

            val membersSnap = membersDeferred.await()
            val tripsSnap = tripsDeferred.await()
            val depositsSnap = depositsDeferred.await()

            val members = membersSnap.documents
            val totalBalance = members.sumOf { (it.getDouble("balance") ?: 0.0) }

            val trips = tripsSnap.documents
            val totalSpent = trips.sumOf { (it.getDouble("total_toll") ?: 0.0) }
            val today = DateUtils.getToday()
            val todayTrips = trips.count { it.getString("trip_date") == today }

            val totalDeposited = depositsSnap.documents.sumOf { (it.getDouble("amount") ?: 0.0) }

            GroupStats(
                totalBalance = totalBalance,
                totalSpent = totalSpent,
                totalDeposited = totalDeposited,
                memberCount = members.size,
                tripCount = trips.size,
                todayTrips = todayTrips
            )
        } catch (e: Exception) {
            GroupStats()
        }
    }
}

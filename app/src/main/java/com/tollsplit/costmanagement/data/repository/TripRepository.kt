package com.tollsplit.costmanagement.data.repository

import com.google.firebase.firestore.DocumentReference
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.tollsplit.costmanagement.data.model.Trip
import com.tollsplit.costmanagement.data.model.TripMember
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.Date
import kotlin.math.round

data class MemberSpending(
    val memberId: String,
    val memberName: String,
    val avatarColor: String,
    val totalSpent: Double,
    val tripCount: Int
)

data class TripReport(
    val totalToll: Double = 0.0,
    val tripCount: Int = 0,
    val trips: List<Trip> = emptyList(),
    val memberSpending: List<MemberSpending> = emptyList()
)

class TripRepository(private val db: FirebaseFirestore = FirebaseFirestore.getInstance()) {

    fun getTripsFlow(groupId: String): Flow<List<Trip>> = callbackFlow {
        if (groupId.isEmpty()) {
            trySend(emptyList())
            close()
            return@callbackFlow
        }
        val listener = db.collection("trips")
            .whereEqualTo("group_id", groupId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val trips = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Trip::class.java)?.copy(id = doc.id)
                }?.sortedWith(
                    compareByDescending<Trip> { it.trip_date }
                        .thenByDescending { it.created_at?.time ?: 0L }
                ) ?: emptyList()
                trySend(trips)
            }
        awaitClose { listener.remove() }
    }

    suspend fun getTrips(groupId: String, limitCount: Int = 50): List<Trip> {
        if (groupId.isEmpty()) return emptyList()
        val snapshot = db.collection("trips")
            .whereEqualTo("group_id", groupId)
            .get()
            .await()
        return snapshot.documents.mapNotNull { doc ->
            doc.toObject(Trip::class.java)?.copy(id = doc.id)
        }.sortedWith(
            compareByDescending<Trip> { it.trip_date }
                .thenByDescending { it.created_at?.time ?: 0L }
        ).take(limitCount)
    }

    suspend fun createTrip(
        groupId: String,
        date: String,
        totalToll: Double,
        memberIds: List<String>,
        note: String
    ): String {
        if (memberIds.isEmpty()) throw IllegalArgumentException("At least one member required")
        val perPersonCost = round((totalToll / memberIds.size) * 100.0) / 100.0
        val tripRef = db.collection("trips").document()
        val tripId = tripRef.id

        db.runTransaction { transaction ->
            // 1. Read all members involved
            val memberDocs = mutableListOf<Pair<DocumentReference, DocumentSnapshot>>()
            for (mId in memberIds) {
                val ref = db.collection("members").document(mId)
                val snap = transaction.get(ref)
                if (!snap.exists()) {
                    throw IllegalStateException("Member $mId does not exist!")
                }
                memberDocs.add(Pair(ref, snap))
            }

            // 2. Build embedded members list
            val embeddedMembers = memberDocs.map { (ref, snap) ->
                val name = snap.getString("name") ?: ""
                val color = snap.getString("avatar_color") ?: "#10b981"
                TripMember(
                    member_id = snap.id,
                    cost_share = perPersonCost,
                    member_name = name,
                    avatar_color = color
                )
            }

            // 3. Write trip document
            val tripData = hashMapOf(
                "group_id" to groupId,
                "trip_date" to date,
                "total_toll" to totalToll,
                "traveler_count" to memberIds.size,
                "per_person_cost" to perPersonCost,
                "note" to note,
                "created_at" to Date(),
                "members" to embeddedMembers,
                "member_ids" to memberIds
            )
            transaction.set(tripRef, tripData)

            // 4. Update member balances and record transactions
            for ((ref, snap) in memberDocs) {
                val currentBalance = snap.getDouble("balance") ?: 0.0
                val newBalance = currentBalance - perPersonCost
                val name = snap.getString("name") ?: ""
                val color = snap.getString("avatar_color") ?: "#10b981"

                transaction.update(ref, "balance", newBalance)

                val txRef = db.collection("transactions").document()
                val txData = hashMapOf(
                    "group_id" to groupId,
                    "member_id" to snap.id,
                    "type" to "trip",
                    "amount" to perPersonCost,
                    "note" to note.ifBlank { "Trip on $date" },
                    "created_at" to Date(),
                    "member_name" to name,
                    "avatar_color" to color,
                    "trip_id" to tripId
                )
                transaction.set(txRef, txData)
            }
            tripId
        }.await()

        return tripId
    }

    suspend fun deleteTrip(tripId: String) {
        val tripRef = db.collection("trips").document(tripId)

        db.runTransaction { transaction ->
            val tripSnap = transaction.get(tripRef)
            if (!tripSnap.exists()) {
                throw IllegalStateException("Trip not found!")
            }

            val trip = tripSnap.toObject(Trip::class.java)
            val perPersonCost = trip?.per_person_cost ?: 0.0

            // 1. Fetch all member documents (Reads)
            val memberSnaps = mutableListOf<Pair<DocumentReference, DocumentSnapshot>>()
            if (trip?.members != null) {
                for (m in trip.members) {
                    val ref = db.collection("members").document(m.member_id)
                    val snap = transaction.get(ref)
                    memberSnaps.add(Pair(ref, snap))
                }
            }

            // 2. Reverse balances for each member (Writes)
            for ((ref, snap) in memberSnaps) {
                if (snap.exists()) {
                    val currentBalance = snap.getDouble("balance") ?: 0.0
                    val newBalance = currentBalance + perPersonCost
                    transaction.update(ref, "balance", newBalance)
                }
            }

            // 3. Delete trip document (Write)
            transaction.delete(tripRef)
            null
        }.await()

        // 4. Delete corresponding transactions for this trip
        val txSnap = db.collection("transactions")
            .whereEqualTo("trip_id", tripId)
            .get()
            .await()
        val batch = db.batch()
        for (doc in txSnap.documents) {
            batch.delete(doc.reference)
        }
        batch.commit().await()
    }

    suspend fun getReportByDateRange(groupId: String, startDate: String, endDate: String): TripReport {
        if (groupId.isEmpty()) return TripReport()
        val snapshot = db.collection("trips")
            .whereEqualTo("group_id", groupId)
            .get()
            .await()

        val filteredTrips = snapshot.documents.mapNotNull { doc ->
            doc.toObject(Trip::class.java)?.copy(id = doc.id)
        }.filter {
            it.trip_date >= startDate && it.trip_date <= endDate
        }.sortedWith(
            compareByDescending<Trip> { it.trip_date }
                .thenByDescending { it.created_at?.time ?: 0L }
        )

        val totalToll = filteredTrips.sumOf { it.total_toll }
        val spendingMap = mutableMapOf<String, MemberSpending>()

        for (t in filteredTrips) {
            for (m in t.members) {
                val current = spendingMap[m.member_id]
                if (current == null) {
                    spendingMap[m.member_id] = MemberSpending(
                        memberId = m.member_id,
                        memberName = m.member_name.ifBlank { "Unknown" },
                        avatarColor = m.avatar_color.ifBlank { "#10b981" },
                        totalSpent = m.cost_share,
                        tripCount = 1
                    )
                } else {
                    spendingMap[m.member_id] = current.copy(
                        totalSpent = current.totalSpent + m.cost_share,
                        tripCount = current.tripCount + 1
                    )
                }
            }
        }

        val sortedMemberSpending = spendingMap.values.sortedByDescending { it.totalSpent }

        return TripReport(
            totalToll = totalToll,
            tripCount = filteredTrips.size,
            trips = filteredTrips,
            memberSpending = sortedMemberSpending
        )
    }
}

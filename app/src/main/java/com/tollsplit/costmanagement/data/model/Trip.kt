package com.tollsplit.costmanagement.data.model

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.PropertyName
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class TripMember(
    @get:PropertyName("member_id")
    @set:PropertyName("member_id")
    var member_id: String = "",
    @get:PropertyName("cost_share")
    @set:PropertyName("cost_share")
    var cost_share: Double = 0.0,
    @get:PropertyName("member_name")
    @set:PropertyName("member_name")
    var member_name: String = "",
    @get:PropertyName("avatar_color")
    @set:PropertyName("avatar_color")
    var avatar_color: String = "#10b981"
)

data class Trip(
    @DocumentId
    val id: String = "",
    @get:PropertyName("group_id")
    @set:PropertyName("group_id")
    var group_id: String = "",
    @get:PropertyName("trip_date")
    @set:PropertyName("trip_date")
    var trip_date: String = "",
    @get:PropertyName("total_toll")
    @set:PropertyName("total_toll")
    var total_toll: Double = 0.0,
    @get:PropertyName("traveler_count")
    @set:PropertyName("traveler_count")
    var traveler_count: Int = 0,
    @get:PropertyName("per_person_cost")
    @set:PropertyName("per_person_cost")
    var per_person_cost: Double = 0.0,
    val note: String = "",
    @ServerTimestamp
    @get:PropertyName("created_at")
    @set:PropertyName("created_at")
    var created_at: Date? = null,
    val members: List<TripMember> = emptyList(),
    @get:PropertyName("member_ids")
    @set:PropertyName("member_ids")
    var member_ids: List<String> = emptyList()
)

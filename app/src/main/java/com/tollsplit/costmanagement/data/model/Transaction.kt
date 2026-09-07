package com.tollsplit.costmanagement.data.model

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.PropertyName
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class Transaction(
    @DocumentId
    val id: String = "",
    @get:PropertyName("group_id")
    @set:PropertyName("group_id")
    var group_id: String = "",
    @get:PropertyName("member_id")
    @set:PropertyName("member_id")
    var member_id: String = "",
    val type: String = "deposit", // "trip", "deposit", "deduction"
    val amount: Double = 0.0,
    val note: String = "",
    @ServerTimestamp
    @get:PropertyName("created_at")
    @set:PropertyName("created_at")
    var created_at: Date? = null,
    @get:PropertyName("member_name")
    @set:PropertyName("member_name")
    var member_name: String = "",
    @get:PropertyName("avatar_color")
    @set:PropertyName("avatar_color")
    var avatar_color: String = "#10b981",
    @get:PropertyName("trip_id")
    @set:PropertyName("trip_id")
    var trip_id: String? = null
)

package com.tollsplit.costmanagement.data.model

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.PropertyName
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class Member(
    @DocumentId
    val id: String = "",
    @get:PropertyName("group_id")
    @set:PropertyName("group_id")
    var group_id: String = "",
    val name: String = "",
    val phone: String = "",
    var balance: Double = 0.0,
    @get:PropertyName("avatar_color")
    @set:PropertyName("avatar_color")
    var avatar_color: String = "#10b981",
    @get:PropertyName("is_active")
    @set:PropertyName("is_active")
    var is_active: Boolean = true,
    @ServerTimestamp
    @get:PropertyName("created_at")
    @set:PropertyName("created_at")
    var created_at: Date? = null
)

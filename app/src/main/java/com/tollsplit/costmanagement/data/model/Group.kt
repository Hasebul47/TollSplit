package com.tollsplit.costmanagement.data.model

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.PropertyName
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class Group(
    @DocumentId
    val id: String = "",
    val name: String = "",
    val description: String = "",
    @get:PropertyName("default_toll")
    @set:PropertyName("default_toll")
    var default_toll: Double = 80.0,
    @get:PropertyName("default_deposit")
    @set:PropertyName("default_deposit")
    var default_deposit: Double = 300.0,
    @ServerTimestamp
    @get:PropertyName("created_at")
    @set:PropertyName("created_at")
    var created_at: Date? = null
)

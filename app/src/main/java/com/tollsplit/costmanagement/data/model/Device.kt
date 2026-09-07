package com.tollsplit.costmanagement.data.model

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.PropertyName
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class Device(
    @DocumentId
    val id: String = "",
    val deviceId: String = "",
    val os: String = "android",
    val osVersion: String = "",
    @ServerTimestamp
    var lastActive: Date? = null,
    val userName: String = "Android User",
    @get:PropertyName("isBanned")
    @set:PropertyName("isBanned")
    var isBanned: Boolean = false
)

data class AppNotification(
    @DocumentId
    val id: String = "",
    val message: String = "",
    @ServerTimestamp
    @get:PropertyName("created_at")
    @set:PropertyName("created_at")
    var created_at: Date? = null
)

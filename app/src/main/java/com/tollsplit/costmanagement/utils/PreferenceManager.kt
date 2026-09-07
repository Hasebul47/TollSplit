package com.tollsplit.costmanagement.utils

import android.content.Context
import android.content.SharedPreferences
import java.util.UUID

class PreferenceManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("tollsplit_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_ACTIVE_GROUP_ID = "active_group_id"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_USER_NAME = "device_user_name"
        private const val KEY_LAST_DISMISSED_NOTIF = "last_dismissed_notif_id"
        private const val KEY_REMEMBER_ADMIN = "remember_admin"
    }

    var activeGroupId: String?
        get() = prefs.getString(KEY_ACTIVE_GROUP_ID, null)
        set(value) = prefs.edit().putString(KEY_ACTIVE_GROUP_ID, value).apply()

    var userRole: String
        get() = prefs.getString(KEY_USER_ROLE, "viewer") ?: "viewer"
        set(value) = prefs.edit().putString(KEY_USER_ROLE, value).apply()

    var deviceId: String
        get() {
            var id = prefs.getString(KEY_DEVICE_ID, null)
            if (id.isNullOrEmpty()) {
                id = "dev_" + UUID.randomUUID().toString().take(12) + "_" + System.currentTimeMillis()
                prefs.edit().putString(KEY_DEVICE_ID, id).apply()
            }
            return id
        }
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value).apply()

    var deviceUserName: String
        get() = prefs.getString(KEY_DEVICE_USER_NAME, "Android User") ?: "Android User"
        set(value) = prefs.edit().putString(KEY_DEVICE_USER_NAME, value).apply()

    var lastDismissedNotificationId: String?
        get() = prefs.getString(KEY_LAST_DISMISSED_NOTIF, null)
        set(value) = prefs.edit().putString(KEY_LAST_DISMISSED_NOTIF, value).apply()

    var rememberAdmin: Boolean
        get() = prefs.getBoolean(KEY_REMEMBER_ADMIN, false)
        set(value) = prefs.edit().putBoolean(KEY_REMEMBER_ADMIN, value).apply()
}

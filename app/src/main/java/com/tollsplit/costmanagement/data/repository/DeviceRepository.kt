package com.tollsplit.costmanagement.data.repository

import android.os.Build
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.tollsplit.costmanagement.data.model.Device
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import java.util.Date

class DeviceRepository(private val db: FirebaseFirestore = FirebaseFirestore.getInstance()) {

    suspend fun registerDevice(deviceId: String, userName: String) = withContext(Dispatchers.IO) {
        val deviceRef = db.collection("devices").document(deviceId)
        val data = hashMapOf(
            "deviceId" to deviceId,
            "os" to "android",
            "osVersion" to Build.VERSION.RELEASE,
            "lastActive" to Date(),
            "userName" to userName
        )
        deviceRef.set(data, SetOptions.merge()).await()
    }

    fun observeDeviceBan(deviceId: String): Flow<Boolean> = callbackFlow {
        val deviceRef = db.collection("devices").document(deviceId)
        val listener = deviceRef.addSnapshotListener { snapshot, error ->
            if (error != null) {
                close(error)
                return@addSnapshotListener
            }
            val isBanned = snapshot?.getBoolean("isBanned") ?: false
            trySend(isBanned)
        }
        awaitClose { listener.remove() }
    }

    fun getDevicesFlow(): Flow<List<Device>> = callbackFlow {
        val listener = db.collection("devices")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val devices = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Device::class.java)?.copy(id = doc.id)
                }?.sortedByDescending { it.lastActive?.time ?: 0L } ?: emptyList()
                trySend(devices)
            }
        awaitClose { listener.remove() }
    }

    suspend fun updateDeviceBanStatus(deviceId: String, isBanned: Boolean) = withContext(Dispatchers.IO) {
        db.collection("devices").document(deviceId).update("isBanned", isBanned).await()
    }

    suspend fun deleteDevice(deviceId: String) = withContext(Dispatchers.IO) {
        db.collection("devices").document(deviceId).delete().await()
    }

    suspend fun updateDeviceUserName(deviceId: String, userName: String) = withContext(Dispatchers.IO) {
        val data = hashMapOf<String, Any>("userName" to userName)
        db.collection("devices").document(deviceId).set(data, SetOptions.merge()).await()
    }
}

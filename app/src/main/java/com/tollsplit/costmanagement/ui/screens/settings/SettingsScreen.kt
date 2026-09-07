package com.tollsplit.costmanagement.ui.screens.settings

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Devices
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tollsplit.costmanagement.data.model.Device
import com.tollsplit.costmanagement.data.model.Group
import com.tollsplit.costmanagement.data.repository.DeviceRepository
import com.tollsplit.costmanagement.data.repository.GroupRepository
import com.tollsplit.costmanagement.data.repository.NotificationRepository
import com.tollsplit.costmanagement.ui.components.AdminPasswordDialog
import com.tollsplit.costmanagement.ui.theme.BgDark
import com.tollsplit.costmanagement.ui.theme.BorderColor
import com.tollsplit.costmanagement.ui.theme.CardDark
import com.tollsplit.costmanagement.ui.theme.PrimaryTeal
import com.tollsplit.costmanagement.ui.theme.StatusDanger
import com.tollsplit.costmanagement.ui.theme.StatusSuccess
import com.tollsplit.costmanagement.ui.theme.StatusWarning
import com.tollsplit.costmanagement.ui.theme.SurfaceElevated
import com.tollsplit.costmanagement.ui.theme.TextMuted
import com.tollsplit.costmanagement.ui.theme.TextPrimary
import com.tollsplit.costmanagement.ui.theme.TextSecondary
import com.tollsplit.costmanagement.utils.PreferenceManager
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    prefManager: PreferenceManager,
    groupRepo: GroupRepository,
    deviceRepo: DeviceRepository,
    notifRepo: NotificationRepository
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var userRole by remember { mutableStateOf(prefManager.userRole) }
    var activeGroupId by remember { mutableStateOf(prefManager.activeGroupId ?: "") }
    var myDeviceUserName by remember { mutableStateOf(prefManager.deviceUserName) }

    val groups by groupRepo.getGroupsFlow().collectAsState(initial = emptyList())
    val devices by deviceRepo.getDevicesFlow().collectAsState(initial = emptyList())

    // Modal dialogs
    var showAdminPasswordDialog by remember { mutableStateOf(false) }
    var pendingRoleChange by remember { mutableStateOf<String?>(null) }

    var showGroupModal by remember { mutableStateOf(false) }
    var editingGroup by remember { mutableStateOf<Group?>(null) }
    var groupToDelete by remember { mutableStateOf<Group?>(null) }

    var showBroadcastDialog by remember { mutableStateOf(false) }
    var showDevicesModal by remember { mutableStateOf(false) }
    var showUserNameDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Settings & Management",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "Configure roles, groups, devices & broadcasts",
                fontSize = 13.sp,
                color = TextSecondary
            )
        }

        // 1. Role Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderColor, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = CardDark),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Security,
                                contentDescription = null,
                                tint = PrimaryTeal,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("Access Role", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrimary)
                                Text("Switch between Viewer and Admin", fontSize = 12.sp, color = TextSecondary)
                            }
                        }

                        Box(
                            modifier = Modifier
                                .background(
                                    if (userRole == "admin") StatusWarning.copy(alpha = 0.15f) else PrimaryTeal.copy(alpha = 0.15f),
                                    RoundedCornerShape(8.dp)
                                )
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = userRole.uppercase(),
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = if (userRole == "admin") StatusWarning else PrimaryTeal
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                if (userRole != "viewer") {
                                    userRole = "viewer"
                                    prefManager.userRole = "viewer"
                                    Toast.makeText(context, "Switched to Viewer role", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (userRole == "viewer") PrimaryTeal else SurfaceElevated
                            )
                        ) {
                            Text(
                                "Viewer",
                                color = if (userRole == "viewer") BgDark else TextPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Button(
                            onClick = {
                                if (userRole != "admin") {
                                    pendingRoleChange = "admin"
                                    showAdminPasswordDialog = true
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (userRole == "admin") StatusWarning else SurfaceElevated
                            )
                        ) {
                            Text(
                                "Admin",
                                color = if (userRole == "admin") BgDark else TextPrimary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // 2. Groups Management Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderColor, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = CardDark),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Group, contentDescription = null, tint = PrimaryTeal)
                            Spacer(modifier = Modifier.width(10.dp))
                            Text("Groups", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrimary)
                        }

                        IconButton(onClick = {
                            editingGroup = null
                            showGroupModal = true
                        }) {
                            Icon(Icons.Default.Add, contentDescription = "Add Group", tint = PrimaryTeal)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    groups.forEach { group ->
                        val isActive = group.id == activeGroupId
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp)
                                .background(
                                    if (isActive) PrimaryTeal.copy(alpha = 0.1f) else SurfaceElevated,
                                    RoundedCornerShape(10.dp)
                                )
                                .border(
                                    1.dp,
                                    if (isActive) PrimaryTeal else BorderColor,
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable {
                                    activeGroupId = group.id
                                    prefManager.activeGroupId = group.id
                                    Toast.makeText(context, "Active group: ${group.name}", Toast.LENGTH_SHORT).show()
                                }
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = group.name,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 15.sp,
                                    color = TextPrimary
                                )
                                Text(
                                    text = "Default Toll: ${group.default_toll.toInt()} BDT",
                                    fontSize = 12.sp,
                                    color = TextSecondary
                                )
                            }

                            if (isActive) {
                                Box(
                                    modifier = Modifier
                                        .background(PrimaryTeal, RoundedCornerShape(6.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("ACTIVE", color = BgDark, fontWeight = FontWeight.Bold, fontSize = 10.sp)
                                }
                            }

                            IconButton(onClick = {
                                editingGroup = group
                                showGroupModal = true
                            }) {
                                Icon(Icons.Default.Edit, contentDescription = "Edit Group", tint = TextSecondary, modifier = Modifier.size(18.dp))
                            }
                        }
                    }
                }
            }
        }

        // 3. My Device Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderColor, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = CardDark),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PhoneAndroid, contentDescription = null, tint = PrimaryTeal)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text("My Device", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrimary)
                                Text(myDeviceUserName, fontSize = 13.sp, color = TextSecondary)
                            }
                        }

                        IconButton(onClick = { showUserNameDialog = true }) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit Name", tint = PrimaryTeal)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceElevated, RoundedCornerShape(8.dp))
                            .clickable {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                val clip = ClipData.newPlainText("Device ID", prefManager.deviceId)
                                clipboard.setPrimaryClip(clip)
                                Toast.makeText(context, "Device ID copied", Toast.LENGTH_SHORT).show()
                            }
                            .padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Device ID: ${prefManager.deviceId.take(16)}...",
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            color = TextMuted
                        )
                        Text("Copy", color = PrimaryTeal, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // 4. Admin Management Section (Broadcast & Connected Devices)
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderColor, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = CardDark),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Admin Tools", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextPrimary)
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                if (userRole == "admin") {
                                    showBroadcastDialog = true
                                } else {
                                    Toast.makeText(context, "Admin role required", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated)
                        ) {
                            Icon(Icons.Default.Campaign, contentDescription = null, tint = PrimaryTeal, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Broadcast", color = TextPrimary, fontSize = 13.sp)
                        }

                        Button(
                            onClick = {
                                if (userRole == "admin") {
                                    showDevicesModal = true
                                } else {
                                    Toast.makeText(context, "Admin role required", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated)
                        ) {
                            Icon(Icons.Default.Devices, contentDescription = null, tint = PrimaryTeal, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Devices (${devices.size})", color = TextPrimary, fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(32.dp)) }
    }

    // Role Password Dialog
    if (showAdminPasswordDialog) {
        AdminPasswordDialog(
            title = "Admin Access",
            message = "Enter the admin password to switch to Admin mode.",
            onConfirm = {
                showAdminPasswordDialog = false
                userRole = "admin"
                prefManager.userRole = "admin"
                Toast.makeText(context, "Admin mode activated", Toast.LENGTH_SHORT).show()
            },
            onDismiss = {
                showAdminPasswordDialog = false
                pendingRoleChange = null
            }
        )
    }

    // Group Modal (Add or Edit)
    if (showGroupModal) {
        var name by remember { mutableStateOf(editingGroup?.name ?: "") }
        var desc by remember { mutableStateOf(editingGroup?.description ?: "") }
        var toll by remember { mutableStateOf(editingGroup?.default_toll?.toInt()?.toString() ?: "80") }
        var deposit by remember { mutableStateOf(editingGroup?.default_deposit?.toInt()?.toString() ?: "300") }

        AlertDialog(
            onDismissRequest = { showGroupModal = false },
            containerColor = CardDark,
            title = {
                Text(if (editingGroup != null) "Edit Group" else "Add New Group", color = TextPrimary, fontWeight = FontWeight.Bold)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Group Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryTeal,
                            unfocusedBorderColor = BorderColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                    OutlinedTextField(
                        value = desc,
                        onValueChange = { desc = it },
                        label = { Text("Description (Optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryTeal,
                            unfocusedBorderColor = BorderColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                    OutlinedTextField(
                        value = toll,
                        onValueChange = { toll = it },
                        label = { Text("Default Toll (BDT)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryTeal,
                            unfocusedBorderColor = BorderColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                    OutlinedTextField(
                        value = deposit,
                        onValueChange = { deposit = it },
                        label = { Text("Default Deposit (BDT)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryTeal,
                            unfocusedBorderColor = BorderColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isBlank()) {
                            Toast.makeText(context, "Group name required", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        val dTol = toll.toDoubleOrNull() ?: 80.0
                        val dDep = deposit.toDoubleOrNull() ?: 300.0

                        coroutineScope.launch {
                            try {
                                if (editingGroup != null) {
                                    groupRepo.updateGroup(editingGroup!!.id, name.trim(), desc.trim(), dTol, dDep)
                                    Toast.makeText(context, "Group updated", Toast.LENGTH_SHORT).show()
                                } else {
                                    val newId = groupRepo.addGroup(name.trim(), desc.trim(), dTol, dDep)
                                    if (activeGroupId.isEmpty()) {
                                        activeGroupId = newId
                                        prefManager.activeGroupId = newId
                                    }
                                    Toast.makeText(context, "Group created", Toast.LENGTH_SHORT).show()
                                }
                                showGroupModal = false
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryTeal)
                ) {
                    Text("Save", color = BgDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showGroupModal = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }

    // Edit User Name Dialog
    if (showUserNameDialog) {
        var nameInput by remember { mutableStateOf(myDeviceUserName) }

        AlertDialog(
            onDismissRequest = { showUserNameDialog = false },
            containerColor = CardDark,
            title = { Text("Set Device User Name", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = nameInput,
                    onValueChange = { nameInput = it },
                    label = { Text("User Name (e.g. Hasebul)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryTeal,
                        unfocusedBorderColor = BorderColor,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val trimmed = nameInput.trim()
                        if (trimmed.isNotEmpty()) {
                            myDeviceUserName = trimmed
                            prefManager.deviceUserName = trimmed
                            coroutineScope.launch {
                                deviceRepo.updateDeviceUserName(prefManager.deviceId, trimmed)
                            }
                        }
                        showUserNameDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryTeal)
                ) {
                    Text("Save", color = BgDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showUserNameDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }

    // Broadcast Notification Dialog
    if (showBroadcastDialog) {
        var broadcastMsg by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showBroadcastDialog = false },
            containerColor = CardDark,
            title = { Text("Send Broadcast Announcement", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = broadcastMsg,
                    onValueChange = { broadcastMsg = it },
                    label = { Text("Message to all users") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryTeal,
                        unfocusedBorderColor = BorderColor,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (broadcastMsg.isNotBlank()) {
                            coroutineScope.launch {
                                try {
                                    notifRepo.sendNotification(broadcastMsg.trim())
                                    showBroadcastDialog = false
                                    Toast.makeText(context, "Announcement broadcasted!", Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryTeal)
                ) {
                    Text("Send Broadcast", color = BgDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showBroadcastDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }

    // Connected Devices Modal
    if (showDevicesModal) {
        AlertDialog(
            onDismissRequest = { showDevicesModal = false },
            containerColor = CardDark,
            title = { Text("Connected Devices (${devices.size})", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(devices) { dev ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, BorderColor, RoundedCornerShape(8.dp)),
                            colors = CardDefaults.cardColors(containerColor = SurfaceElevated)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = dev.userName.ifBlank { "User" },
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = "${dev.os.uppercase()} • ${dev.deviceId.take(10)}...",
                                        fontSize = 11.sp,
                                        color = TextSecondary
                                    )
                                }

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = if (dev.isBanned) "Banned" else "Active",
                                        color = if (dev.isBanned) StatusDanger else StatusSuccess,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Switch(
                                        checked = dev.isBanned,
                                        onCheckedChange = { banned ->
                                            coroutineScope.launch {
                                                deviceRepo.updateDeviceBanStatus(dev.deviceId, banned)
                                            }
                                        },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = StatusDanger,
                                            checkedTrackColor = StatusDanger.copy(alpha = 0.5f)
                                        )
                                    )
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                OutlinedButton(onClick = { showDevicesModal = false }) {
                    Text("Close", color = TextSecondary)
                }
            }
        )
    }
}

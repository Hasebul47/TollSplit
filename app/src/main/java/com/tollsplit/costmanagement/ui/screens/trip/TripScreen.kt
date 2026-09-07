package com.tollsplit.costmanagement.ui.screens.trip

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Paid
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tollsplit.costmanagement.data.model.Member
import com.tollsplit.costmanagement.data.repository.GroupRepository
import com.tollsplit.costmanagement.data.repository.MemberRepository
import com.tollsplit.costmanagement.data.repository.TripRepository
import com.tollsplit.costmanagement.ui.theme.BgDark
import com.tollsplit.costmanagement.ui.theme.BorderColor
import com.tollsplit.costmanagement.ui.theme.CardDark
import com.tollsplit.costmanagement.ui.theme.PrimaryTeal
import com.tollsplit.costmanagement.ui.theme.StatusSuccess
import com.tollsplit.costmanagement.ui.theme.SurfaceElevated
import com.tollsplit.costmanagement.ui.theme.TextMuted
import com.tollsplit.costmanagement.ui.theme.TextPrimary
import com.tollsplit.costmanagement.ui.theme.TextSecondary
import com.tollsplit.costmanagement.utils.ColorUtils
import com.tollsplit.costmanagement.utils.CurrencyUtils
import com.tollsplit.costmanagement.utils.DateUtils
import com.tollsplit.costmanagement.utils.PreferenceManager
import kotlinx.coroutines.launch
import kotlin.math.round

@Composable
fun TripScreen(
    prefManager: PreferenceManager,
    groupRepo: GroupRepository,
    memberRepo: MemberRepository,
    tripRepo: TripRepository
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val activeGroupId = prefManager.activeGroupId ?: ""

    val allMembers by memberRepo.getMembersFlow(activeGroupId).collectAsState(initial = emptyList())
    val members = remember(allMembers) { allMembers.filter { it.is_active } }
    val userRole by prefManager.userRoleFlow.collectAsState()
    val isAdmin = userRole == "admin"
    var tripDate by remember { mutableStateOf(DateUtils.getToday()) }
    var tollAmountText by remember { mutableStateOf("80") }
    var note by remember { mutableStateOf("") }
    val selectedMemberIds = remember { mutableStateOf(setOf<String>()) }

    var isSubmitting by remember { mutableStateOf(false) }
    var showConfirmDialog by remember { mutableStateOf(false) }
    var showSuccessBanner by remember { mutableStateOf(false) }

    LaunchedEffect(activeGroupId) {
        if (activeGroupId.isNotEmpty()) {
            val group = groupRepo.getGroupById(activeGroupId)
            if (group != null) {
                tollAmountText = if (group.default_toll % 1.0 == 0.0) group.default_toll.toInt().toString() else group.default_toll.toString()
            }
        }
    }

    val toll = tollAmountText.toDoubleOrNull() ?: 0.0
    val travelerCount = selectedMemberIds.value.size
    val perPerson = if (travelerCount > 0) round((toll / travelerCount) * 100.0) / 100.0 else 0.0

    fun toggleMember(id: String) {
        val current = selectedMemberIds.value.toMutableSet()
        if (current.contains(id)) {
            current.remove(id)
        } else {
            current.add(id)
        }
        selectedMemberIds.value = current
    }

    fun toggleSelectAll() {
        if (selectedMemberIds.value.size == members.size) {
            selectedMemberIds.value = emptySet()
        } else {
            selectedMemberIds.value = members.map { it.id }.toSet()
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Log New Trip",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "Record toll expense and split automatically",
                fontSize = 13.sp,
                color = TextSecondary
            )
        }

        // Viewer Mode Warning Banner
        if (!isAdmin) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, PrimaryTeal.copy(alpha = 0.3f), RoundedCornerShape(12.dp)),
                    colors = CardDefaults.cardColors(containerColor = PrimaryTeal.copy(alpha = 0.08f))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = PrimaryTeal,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Viewer Mode (Read-Only): Only Admins can log new trips. Switch to Admin mode in Settings to log trips.",
                            color = TextPrimary,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }

        // Success message banner
        if (showSuccessBanner) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, StatusSuccess.copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
                    colors = CardDefaults.cardColors(containerColor = StatusSuccess.copy(alpha = 0.12f))
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = StatusSuccess,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Trip logged successfully and balances updated!",
                            color = TextPrimary,
                            fontWeight = FontWeight.Medium,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }

        // Input Fields: Date & Toll
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, BorderColor, RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = CardDark),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    OutlinedTextField(
                        value = tripDate,
                        onValueChange = { tripDate = it },
                        label = { Text("Trip Date (YYYY-MM-DD)") },
                        leadingIcon = {
                            Icon(Icons.Default.DateRange, contentDescription = null, tint = PrimaryTeal)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryTeal,
                            unfocusedBorderColor = BorderColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedLabelColor = PrimaryTeal,
                            unfocusedLabelColor = TextSecondary
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = tollAmountText,
                        onValueChange = { tollAmountText = it },
                        label = { Text("Total Toll Amount (BDT)") },
                        leadingIcon = {
                            Icon(Icons.Default.Paid, contentDescription = null, tint = PrimaryTeal)
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryTeal,
                            unfocusedBorderColor = BorderColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedLabelColor = PrimaryTeal,
                            unfocusedLabelColor = TextSecondary
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        label = { Text("Optional Note (e.g. Morning commute)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryTeal,
                            unfocusedBorderColor = BorderColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary,
                            focusedLabelColor = PrimaryTeal,
                            unfocusedLabelColor = TextSecondary
                        )
                    )
                }
            }
        }

        // Live Split Summary Card
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, PrimaryTeal.copy(alpha = 0.3f), RoundedCornerShape(16.dp)),
                colors = CardDefaults.cardColors(containerColor = PrimaryTeal.copy(alpha = 0.08f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Travelers Selected", fontSize = 12.sp, color = TextSecondary)
                        Text(
                            "$travelerCount / ${members.size}",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text("Each Pays", fontSize = 12.sp, color = TextSecondary)
                        Text(
                            CurrencyUtils.formatCurrency(perPerson),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = PrimaryTeal
                        )
                    }
                }
            }
        }

        // Member Selection Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Select Travelers",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )

                Text(
                    text = if (selectedMemberIds.value.size == members.size) "Deselect All" else "Select All",
                    fontSize = 13.sp,
                    color = PrimaryTeal,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.clickable { toggleSelectAll() }
                )
            }
        }

        // Member Selection Items
        items(members, key = { it.id }) { member ->
            val isSelected = selectedMemberIds.value.contains(member.id)
            val avatarColor = remember(member.avatar_color) { ColorUtils.parseHexColor(member.avatar_color) }

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(
                        1.dp,
                        if (isSelected) PrimaryTeal else BorderColor,
                        RoundedCornerShape(12.dp)
                    )
                    .clickable { toggleMember(member.id) },
                colors = CardDefaults.cardColors(
                    containerColor = if (isSelected) PrimaryTeal.copy(alpha = 0.12f) else CardDark
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .background(avatarColor, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = member.name.take(1).uppercase(),
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = member.name,
                            color = TextPrimary,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 15.sp
                        )
                        Text(
                            text = "Balance: ${CurrencyUtils.formatCurrency(member.balance)}",
                            color = CurrencyUtils.getBalanceColor(member.balance),
                            fontSize = 12.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .background(
                                if (isSelected) PrimaryTeal else SurfaceElevated,
                                CircleShape
                            )
                            .border(1.dp, if (isSelected) PrimaryTeal else BorderColor, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isSelected) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = null,
                                tint = BgDark,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }

        // Submit Button
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = {
                    if (!isAdmin) {
                        Toast.makeText(context, "Viewer mode: Switch to Admin in Settings to log trips", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (travelerCount == 0) {
                        Toast.makeText(context, "Please select at least one traveler", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (toll <= 0) {
                        Toast.makeText(context, "Please enter a valid toll amount", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    showConfirmDialog = true
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                enabled = isAdmin && !isSubmitting && travelerCount > 0 && toll > 0,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isAdmin) PrimaryTeal else SurfaceElevated,
                    disabledContainerColor = SurfaceElevated
                ),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(22.dp), color = BgDark)
                } else if (!isAdmin) {
                    Icon(Icons.Default.Lock, contentDescription = null, tint = TextMuted)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Admin Mode Required to Log Trip",
                        color = TextMuted,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                } else {
                    Icon(Icons.Default.DirectionsCar, contentDescription = null, tint = BgDark)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Confirm & Log Trip",
                        color = BgDark,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    if (showConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmDialog = false },
            containerColor = CardDark,
            title = {
                Text(
                    text = "Confirm Trip",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column {
                    Text(
                        text = "Date: $tripDate",
                        color = TextSecondary,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "Total Toll: ${CurrencyUtils.formatCurrency(toll)}",
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                    Text(
                        text = "Travelers: $travelerCount",
                        color = TextSecondary,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Each traveler will be deducted ${CurrencyUtils.formatCurrency(perPerson)}.",
                        color = PrimaryTeal,
                        fontWeight = FontWeight.Medium,
                        fontSize = 14.sp
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showConfirmDialog = false
                        isSubmitting = true
                        coroutineScope.launch {
                            try {
                                tripRepo.createTrip(
                                    groupId = activeGroupId,
                                    date = tripDate,
                                    totalToll = toll,
                                    memberIds = selectedMemberIds.value.toList(),
                                    note = note.trim()
                                )
                                showSuccessBanner = true
                                selectedMemberIds.value = emptySet()
                                note = ""
                                Toast.makeText(context, "Trip successfully logged!", Toast.LENGTH_SHORT).show()
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                            } finally {
                                isSubmitting = false
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryTeal)
                ) {
                    Text("Proceed", color = BgDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showConfirmDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }
}

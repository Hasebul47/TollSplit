package com.tollsplit.costmanagement.ui.screens.members

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
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tollsplit.costmanagement.data.model.Member
import com.tollsplit.costmanagement.data.repository.MemberRepository
import com.tollsplit.costmanagement.data.repository.MemberStats
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
import com.tollsplit.costmanagement.utils.ColorUtils
import com.tollsplit.costmanagement.utils.CurrencyUtils
import com.tollsplit.costmanagement.utils.PreferenceManager
import kotlinx.coroutines.launch

@Composable
fun MembersScreen(
    prefManager: PreferenceManager,
    memberRepo: MemberRepository
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val activeGroupId = prefManager.activeGroupId ?: ""

    val members by memberRepo.getMembersFlow(activeGroupId).collectAsState(initial = emptyList())
    val userRole by prefManager.userRoleFlow.collectAsState()
    val isAdmin = userRole == "admin"
    var selectedStatusTab by remember { mutableIntStateOf(0) } // 0 = All, 1 = Active, 2 = Inactive
    var searchQuery by remember { mutableStateOf("") }

    // Dialog states
    var showAddMemberDialog by remember { mutableStateOf(false) }
    var selectedMemberForDetail by remember { mutableStateOf<Member?>(null) }
    var memberStats by remember { mutableStateOf<MemberStats?>(null) }

    var showDepositDialog by remember { mutableStateOf(false) }
    var depositMember by remember { mutableStateOf<Member?>(null) }
    var depositType by remember { mutableStateOf("deposit") } // deposit or deduction

    var showEditDialog by remember { mutableStateOf(false) }
    var editMember by remember { mutableStateOf<Member?>(null) }

    var showAdminPasswordDialog by remember { mutableStateOf(false) }
    var pendingAdminAction by remember { mutableStateOf<(() -> Unit)?>(null) }

    val filteredMembers = members.filter { m ->
        val matchesSearch = m.name.contains(searchQuery, ignoreCase = true) || m.phone.contains(searchQuery)
        val matchesStatus = when (selectedStatusTab) {
            1 -> m.is_active
            2 -> !m.is_active
            else -> true
        }
        matchesSearch && matchesStatus
    }

    LaunchedEffect(selectedMemberForDetail) {
        val m = selectedMemberForDetail
        if (m != null) {
            memberStats = memberRepo.getMemberStats(m.id)
        } else {
            memberStats = null
        }
    }

    Scaffold(
        containerColor = BgDark,
        floatingActionButton = {
            if (isAdmin) {
                FloatingActionButton(
                    onClick = { showAddMemberDialog = true },
                    containerColor = PrimaryTeal,
                    contentColor = BgDark
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add Member")
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Group Members",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        val activeCount = members.count { it.is_active }
                        Text(
                            text = "$activeCount active members in this group",
                            fontSize = 13.sp,
                            color = TextSecondary
                        )
                    }

                    if (!isAdmin) {
                        Box(
                            modifier = Modifier
                                .background(PrimaryTeal.copy(alpha = 0.12f), RoundedCornerShape(12.dp))
                                .border(1.dp, PrimaryTeal.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 10.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "VIEWER (READ-ONLY)",
                                color = PrimaryTeal,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by name or phone...", color = TextMuted) },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = PrimaryTeal)
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Close, contentDescription = "Clear", tint = TextMuted)
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryTeal,
                        unfocusedBorderColor = BorderColor,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedContainerColor = CardDark,
                        unfocusedContainerColor = CardDark
                    )
                )
            }

            // Status Filter Tabs
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val activeCount = members.count { it.is_active }
                    val inactiveCount = members.count { !it.is_active }
                    val tabs = listOf("All (${members.size})", "Active ($activeCount)", "Inactive ($inactiveCount)")
                    tabs.forEachIndexed { index, title ->
                        val selected = selectedStatusTab == index
                        Box(
                            modifier = Modifier
                                .background(
                                    if (selected) PrimaryTeal else SurfaceElevated,
                                    RoundedCornerShape(20.dp)
                                )
                                .clickable { selectedStatusTab = index }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = title,
                                color = if (selected) BgDark else TextSecondary,
                                fontSize = 12.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // Members List
            items(filteredMembers, key = { it.id }) { member ->
                MemberCard(
                    member = member,
                    onClick = { selectedMemberForDetail = member }
                )
            }

            item {
                Spacer(modifier = Modifier.height(72.dp))
            }
        }
    }

    // 1. Member Detail Modal
    selectedMemberForDetail?.let { member ->
        AlertDialog(
            onDismissRequest = { selectedMemberForDetail = null },
            containerColor = CardDark,
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .background(ColorUtils.parseHexColor(member.avatar_color), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = member.name.take(1).uppercase(),
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = member.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = TextPrimary
                        )
                        if (member.phone.isNotEmpty()) {
                            Text(
                                text = member.phone,
                                fontSize = 13.sp,
                                color = TextSecondary
                            )
                        }
                    }
                    Box(
                        modifier = Modifier
                            .background(
                                if (member.is_active) StatusSuccess.copy(alpha = 0.15f) else StatusDanger.copy(alpha = 0.15f),
                                RoundedCornerShape(8.dp)
                            )
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = if (member.is_active) "ACTIVE" else "INACTIVE",
                            color = if (member.is_active) StatusSuccess else StatusDanger,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    // Balance info
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
                        colors = CardDefaults.cardColors(containerColor = SurfaceElevated)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Current Balance", fontSize = 12.sp, color = TextSecondary)
                                if (!member.is_active) {
                                    Text(
                                        "Excluded from group total",
                                        fontSize = 11.sp,
                                        color = StatusDanger,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                CurrencyUtils.formatCurrency(member.balance),
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = CurrencyUtils.getBalanceColor(member.balance)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Stats row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, BorderColor, RoundedCornerShape(8.dp)),
                            colors = CardDefaults.cardColors(containerColor = SurfaceElevated)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text("Total Spent", fontSize = 11.sp, color = TextSecondary)
                                Text(
                                    CurrencyUtils.formatCurrency(memberStats?.spent ?: 0.0),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                            }
                        }
                        Card(
                            modifier = Modifier
                                .weight(1f)
                                .border(1.dp, BorderColor, RoundedCornerShape(8.dp)),
                            colors = CardDefaults.cardColors(containerColor = SurfaceElevated)
                        ) {
                            Column(modifier = Modifier.padding(10.dp)) {
                                Text("Trips", fontSize = 11.sp, color = TextSecondary)
                                Text(
                                    "${memberStats?.tripCount ?: 0}",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    if (!isAdmin) {
                        // Read-only Viewer Notice
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(PrimaryTeal.copy(alpha = 0.08f), RoundedCornerShape(10.dp))
                                .border(1.dp, PrimaryTeal.copy(alpha = 0.25f), RoundedCornerShape(10.dp))
                                .padding(12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Viewer Mode: Only Admins can modify members, toggle status, or log deposits. Switch to Admin mode in Settings.",
                                fontSize = 12.sp,
                                color = PrimaryTeal,
                                fontWeight = FontWeight.Medium,
                                textAlign = TextAlign.Center
                            )
                        }
                    } else {
                        // Admin action buttons
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    depositMember = member
                                    depositType = "deposit"
                                    showDepositDialog = true
                                    selectedMemberForDetail = null
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryTeal)
                            ) {
                                Icon(Icons.Default.Payments, contentDescription = null, tint = BgDark, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Deposit", color = BgDark, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }

                            Button(
                                onClick = {
                                    depositMember = member
                                    depositType = "deduction"
                                    showDepositDialog = true
                                    selectedMemberForDetail = null
                                },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated)
                            ) {
                                Text("Deduct", color = TextPrimary, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Active / Inactive toggle button
                        Button(
                            onClick = {
                                val newActiveState = !member.is_active
                                coroutineScope.launch {
                                    try {
                                        memberRepo.setMemberActiveStatus(member.id, newActiveState)
                                        val msg = if (newActiveState) {
                                            "${member.name} activated! Balance restored to group total."
                                        } else {
                                            "${member.name} set to Inactive. Balance excluded from group total."
                                        }
                                        Toast.makeText(context, msg, Toast.LENGTH_LONG).show()
                                        selectedMemberForDetail = null
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (member.is_active) StatusWarning.copy(alpha = 0.2f) else StatusSuccess.copy(alpha = 0.2f)
                            ),
                            border = BorderStroke(
                                1.dp,
                                if (member.is_active) StatusWarning else StatusSuccess
                            )
                        ) {
                            Icon(
                                imageVector = if (member.is_active) Icons.Default.Block else Icons.Default.Check,
                                contentDescription = null,
                                tint = if (member.is_active) StatusWarning else StatusSuccess,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (member.is_active) "Set Inactive (Exclude Balance)" else "Set Active (Include Balance)",
                                color = if (member.is_active) StatusWarning else StatusSuccess,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = {
                                    editMember = member
                                    showEditDialog = true
                                    selectedMemberForDetail = null
                                },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary),
                                border = BorderStroke(1.dp, BorderColor)
                            ) {
                                Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextSecondary, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Edit Member", fontSize = 12.sp)
                            }

                            IconButton(onClick = {
                                pendingAdminAction = {
                                    coroutineScope.launch {
                                        try {
                                            memberRepo.deleteMember(member.id)
                                            Toast.makeText(context, "${member.name} deleted", Toast.LENGTH_SHORT).show()
                                            selectedMemberForDetail = null
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                }
                                showAdminPasswordDialog = true
                            }) {
                                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = StatusDanger)
                            }
                        }
                    }
                }
            },
            confirmButton = {
                OutlinedButton(onClick = { selectedMemberForDetail = null }) {
                    Text("Close", color = TextSecondary)
                }
            }
        )
    }

    // 2. Add Member Dialog
    if (showAddMemberDialog) {
        var name by remember { mutableStateOf("") }
        var phone by remember { mutableStateOf("") }
        var deposit by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddMemberDialog = false },
            containerColor = CardDark,
            title = { Text("Add New Member", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Member Name *") },
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
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number (Optional)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
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
                    OutlinedTextField(
                        value = deposit,
                        onValueChange = { deposit = it },
                        label = { Text("Initial Deposit (BDT, Optional)") },
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
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isBlank()) {
                            Toast.makeText(context, "Name is required", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        val initDep = deposit.toDoubleOrNull() ?: 0.0
                        coroutineScope.launch {
                            try {
                                memberRepo.addMember(activeGroupId, name.trim(), phone.trim(), initDep)
                                showAddMemberDialog = false
                                Toast.makeText(context, "Member added successfully!", Toast.LENGTH_SHORT).show()
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryTeal)
                ) {
                    Text("Add Member", color = BgDark, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showAddMemberDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }

    // 3. Deposit / Deduction Dialog
    if (showDepositDialog && depositMember != null) {
        val member = depositMember!!
        var amountText by remember { mutableStateOf("") }
        var noteText by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showDepositDialog = false },
            containerColor = CardDark,
            title = {
                Text(
                    text = if (depositType == "deposit") "Add Deposit for ${member.name}" else "Add Deduction for ${member.name}",
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = amountText,
                        onValueChange = { amountText = it },
                        label = { Text("Amount (BDT) *") },
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
                    OutlinedTextField(
                        value = noteText,
                        onValueChange = { noteText = it },
                        label = { Text("Note (e.g. Cash payment)") },
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
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amount = amountText.toDoubleOrNull()
                        if (amount == null || amount <= 0.0) {
                            Toast.makeText(context, "Enter a valid amount", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        coroutineScope.launch {
                            try {
                                memberRepo.addDeposit(
                                    groupId = activeGroupId,
                                    memberId = member.id,
                                    amount = amount,
                                    note = noteText.trim(),
                                    type = depositType
                                )
                                showDepositDialog = false
                                Toast.makeText(context, "Balance updated!", Toast.LENGTH_SHORT).show()
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (depositType == "deposit") StatusSuccess else StatusDanger
                    )
                ) {
                    Text(if (depositType == "deposit") "Deposit" else "Deduct", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showDepositDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }

    // 4. Edit Member Dialog
    if (showEditDialog && editMember != null) {
        val member = editMember!!
        var editNameText by remember { mutableStateOf(member.name) }
        var editPhoneText by remember { mutableStateOf(member.phone) }

        AlertDialog(
            onDismissRequest = { showEditDialog = false },
            containerColor = CardDark,
            title = { Text("Edit Member", color = TextPrimary, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = editNameText,
                        onValueChange = { editNameText = it },
                        label = { Text("Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = PrimaryTeal,
                            unfocusedBorderColor = BorderColor,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                    OutlinedTextField(
                        value = editPhoneText,
                        onValueChange = { editPhoneText = it },
                        label = { Text("Phone") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
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
                        if (editNameText.isBlank()) {
                            Toast.makeText(context, "Name required", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        coroutineScope.launch {
                            try {
                                memberRepo.updateMember(member.id, editNameText.trim(), editPhoneText.trim())
                                showEditDialog = false
                                Toast.makeText(context, "Member updated", Toast.LENGTH_SHORT).show()
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
                OutlinedButton(onClick = { showEditDialog = false }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }

    // 5. Admin Password Confirmation
    if (showAdminPasswordDialog) {
        AdminPasswordDialog(
            title = "Admin Verification Required",
            message = "Enter the admin password to confirm deactivating this member.",
            onConfirm = {
                showAdminPasswordDialog = false
                pendingAdminAction?.invoke()
            },
            onDismiss = {
                showAdminPasswordDialog = false
                pendingAdminAction = null
            }
        )
    }
}

@Composable
fun MemberCard(member: Member, onClick: () -> Unit) {
    val avatarColor = remember(member.avatar_color) { ColorUtils.parseHexColor(member.avatar_color) }
    val status = CurrencyUtils.getBalanceStatus(member.balance)
    val statusColor = CurrencyUtils.getBalanceColor(member.balance)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(
                1.dp,
                if (!member.is_active) BorderColor.copy(alpha = 0.5f) else BorderColor,
                RoundedCornerShape(14.dp)
            )
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (!member.is_active) CardDark.copy(alpha = 0.65f) else CardDark
        ),
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(
                        if (member.is_active) avatarColor else avatarColor.copy(alpha = 0.5f),
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = member.name.take(1).uppercase(),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = member.name,
                        color = if (member.is_active) TextPrimary else TextSecondary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                    if (!member.is_active) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Box(
                            modifier = Modifier
                                .background(StatusDanger.copy(alpha = 0.15f), RoundedCornerShape(6.dp))
                                .border(1.dp, StatusDanger.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "INACTIVE",
                                color = StatusDanger,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
                if (member.phone.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Phone,
                            contentDescription = null,
                            tint = TextMuted,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = member.phone,
                            color = TextSecondary,
                            fontSize = 12.sp
                        )
                    }
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = CurrencyUtils.formatCurrency(member.balance),
                    color = if (member.is_active) statusColor else statusColor.copy(alpha = 0.6f),
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Box(
                    modifier = Modifier
                        .background(
                            (if (member.is_active) statusColor else TextMuted).copy(alpha = 0.15f),
                            RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = if (member.is_active) status else "Inactive",
                        color = if (member.is_active) statusColor else TextMuted,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

package com.tollsplit.costmanagement.ui.screens.dashboard

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.tollsplit.costmanagement.data.model.Group
import com.tollsplit.costmanagement.data.model.Transaction
import com.tollsplit.costmanagement.data.repository.GroupRepository
import com.tollsplit.costmanagement.data.repository.GroupStats
import com.tollsplit.costmanagement.data.repository.MemberRepository
import com.tollsplit.costmanagement.data.repository.NotificationRepository
import com.tollsplit.costmanagement.data.repository.TransactionRepository
import com.tollsplit.costmanagement.ui.components.StatCard
import com.tollsplit.costmanagement.ui.navigation.Screen
import com.tollsplit.costmanagement.ui.theme.AccentCyan
import com.tollsplit.costmanagement.ui.theme.BgDark
import com.tollsplit.costmanagement.ui.theme.BorderColor
import com.tollsplit.costmanagement.ui.theme.CardDark
import com.tollsplit.costmanagement.ui.theme.PrimaryTeal
import com.tollsplit.costmanagement.ui.theme.StatusDanger
import com.tollsplit.costmanagement.ui.theme.StatusDangerBg
import com.tollsplit.costmanagement.ui.theme.StatusSuccess
import com.tollsplit.costmanagement.ui.theme.StatusSuccessBg
import com.tollsplit.costmanagement.ui.theme.StatusWarning
import com.tollsplit.costmanagement.ui.theme.StatusWarningBg
import com.tollsplit.costmanagement.ui.theme.SurfaceElevated
import com.tollsplit.costmanagement.ui.theme.TextMuted
import com.tollsplit.costmanagement.ui.theme.TextPrimary
import com.tollsplit.costmanagement.ui.theme.TextSecondary
import com.tollsplit.costmanagement.utils.ColorUtils
import com.tollsplit.costmanagement.utils.CurrencyUtils
import com.tollsplit.costmanagement.utils.DateUtils
import com.tollsplit.costmanagement.utils.PreferenceManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun DashboardScreen(
    navController: NavController,
    prefManager: PreferenceManager,
    groupRepo: GroupRepository,
    memberRepo: MemberRepository,
    txRepo: TransactionRepository,
    notifRepo: NotificationRepository
) {
    val coroutineScope = rememberCoroutineScope()
    val groups by groupRepo.getGroupsFlow().collectAsState(initial = emptyList())
    var currentGroupId by remember { mutableStateOf(prefManager.activeGroupId ?: "") }
    var currentGroup by remember { mutableStateOf<Group?>(null) }
    var groupStats by remember { mutableStateOf(GroupStats()) }
    var transactions by remember { mutableStateOf<List<Transaction>>(emptyList()) }
    var showGroupDropdown by remember { mutableStateOf(false) }

    val latestNotification by notifRepo.observeLatestNotification().collectAsState(initial = null)
    var isNotificationDismissed by remember {
        mutableStateOf(prefManager.lastDismissedNotificationId == latestNotification?.id)
    }

    val role by prefManager.userRoleFlow.collectAsState()
    val members by memberRepo.getMembersFlow(currentGroupId).collectAsState(initial = emptyList())

    LaunchedEffect(groups) {
        if (currentGroupId.isEmpty() && groups.isNotEmpty()) {
            val first = groups.first()
            currentGroupId = first.id
            prefManager.activeGroupId = first.id
            currentGroup = first
        } else if (currentGroupId.isNotEmpty()) {
            currentGroup = groups.find { it.id == currentGroupId }
        }
    }

    LaunchedEffect(currentGroupId, members) {
        if (currentGroupId.isNotEmpty()) {
            withContext(Dispatchers.IO) {
                val stats = groupRepo.getGroupStats(currentGroupId)
                val txs = txRepo.getTransactions(currentGroupId, 8)
                groupStats = stats
                transactions = txs
            }
        }
    }

    LaunchedEffect(latestNotification) {
        isNotificationDismissed = prefManager.lastDismissedNotificationId == latestNotification?.id
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Top Header: Group Selector & Role Badge
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box {
                    Row(
                        modifier = Modifier
                            .background(SurfaceElevated, RoundedCornerShape(12.dp))
                            .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
                            .clickable { showGroupDropdown = true }
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = currentGroup?.name ?: "Select Group",
                            color = TextPrimary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "▼", color = PrimaryTeal, fontSize = 10.sp)
                    }

                    DropdownMenu(
                        expanded = showGroupDropdown,
                        onDismissRequest = { showGroupDropdown = false },
                        modifier = Modifier.background(CardDark)
                    ) {
                        groups.forEach { g ->
                            DropdownMenuItem(
                                text = { Text(g.name, color = TextPrimary) },
                                onClick = {
                                    currentGroupId = g.id
                                    currentGroup = g
                                    prefManager.activeGroupId = g.id
                                    showGroupDropdown = false
                                }
                            )
                        }
                    }
                }

                // Role Pill
                val roleColor = if (role == "admin") StatusWarning else PrimaryTeal
                Box(
                    modifier = Modifier
                        .background(roleColor.copy(alpha = 0.15f), RoundedCornerShape(16.dp))
                        .border(1.dp, roleColor.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = role.uppercase(),
                        color = roleColor,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // 2. Broadcast Notification Banner
        if (latestNotification != null && !isNotificationDismissed && latestNotification?.message?.isNotEmpty() == true) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, PrimaryTeal.copy(alpha = 0.4f), RoundedCornerShape(12.dp)),
                    colors = CardDefaults.cardColors(containerColor = PrimaryTeal.copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Campaign,
                            contentDescription = null,
                            tint = PrimaryTeal,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Announcement",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = PrimaryTeal
                            )
                            Text(
                                text = latestNotification?.message ?: "",
                                fontSize = 13.sp,
                                color = TextPrimary
                            )
                        }
                        IconButton(
                            onClick = {
                                isNotificationDismissed = true
                                prefManager.lastDismissedNotificationId = latestNotification?.id
                            },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Dismiss",
                                tint = TextMuted,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }

        // 3. Stat Cards Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                StatCard(
                    title = "Total Group Balance",
                    value = CurrencyUtils.formatCurrency(groupStats.totalBalance),
                    icon = Icons.Default.AccountBalanceWallet,
                    iconColor = StatusSuccess,
                    iconBgColor = StatusSuccessBg
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        StatCard(
                            title = "Total Spent",
                            value = CurrencyUtils.formatCurrency(groupStats.totalSpent),
                            icon = Icons.Default.Payments,
                            iconColor = StatusDanger,
                            iconBgColor = StatusDangerBg
                        )
                    }
                    Box(modifier = Modifier.weight(1f)) {
                        StatCard(
                            title = "Deposited",
                            value = CurrencyUtils.formatCurrency(groupStats.totalDeposited),
                            icon = Icons.Default.ReceiptLong,
                            iconColor = AccentCyan,
                            iconBgColor = AccentCyan.copy(alpha = 0.15f)
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        StatCard(
                            title = "Active Members",
                            value = groupStats.memberCount.toString(),
                            icon = Icons.Default.Group,
                            iconColor = PrimaryTeal,
                            iconBgColor = PrimaryTeal.copy(alpha = 0.15f)
                        )
                    }
                    Box(modifier = Modifier.weight(1f)) {
                        StatCard(
                            title = "Today's Trips",
                            value = groupStats.todayTrips.toString(),
                            icon = Icons.Default.DirectionsCar,
                            iconColor = StatusWarning,
                            iconBgColor = StatusWarningBg
                        )
                    }
                }
            }
        }

        // 4. Quick Actions
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Button(
                    onClick = { navController.navigate(Screen.Trip.route) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryTeal),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.DirectionsCar,
                        contentDescription = null,
                        tint = BgDark,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Log Trip", color = BgDark, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }

                Button(
                    onClick = { navController.navigate(Screen.Members.route) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = null,
                        tint = PrimaryTeal,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Members", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }

        // 5. Recent Transactions Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Recent Transactions",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = "See all",
                    fontSize = 13.sp,
                    color = PrimaryTeal,
                    modifier = Modifier.clickable { navController.navigate(Screen.History.route) }
                )
            }
        }

        // 6. Recent Transactions List
        if (transactions.isEmpty()) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
                    colors = CardDefaults.cardColors(containerColor = CardDark)
                ) {
                    Text(
                        text = "No recent transactions found.",
                        color = TextMuted,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(24.dp)
                    )
                }
            }
        } else {
            items(transactions, key = { it.id }) { tx ->
                TransactionRow(tx)
            }
        }

        item {
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}

@Composable
fun TransactionRow(tx: Transaction) {
    val isDeposit = tx.type == "deposit"
    val avatarColor = remember(tx.avatar_color) { ColorUtils.parseHexColor(tx.avatar_color) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = CardDark),
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
                    .size(40.dp)
                    .background(avatarColor, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = tx.member_name.take(1).uppercase(),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = tx.member_name,
                    color = TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = tx.note.ifBlank { if (isDeposit) "Deposit" else "Trip Share" },
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "${if (isDeposit) "+" else "-"}${CurrencyUtils.formatCurrency(tx.amount)}",
                    color = if (isDeposit) StatusSuccess else StatusDanger,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = DateUtils.formatDateTime(tx.created_at),
                    color = TextMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

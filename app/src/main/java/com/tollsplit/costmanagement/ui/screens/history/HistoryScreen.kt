package com.tollsplit.costmanagement.ui.screens.history

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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tollsplit.costmanagement.data.model.Trip
import com.tollsplit.costmanagement.data.repository.TransactionRepository
import com.tollsplit.costmanagement.data.repository.TripReport
import com.tollsplit.costmanagement.data.repository.TripRepository
import com.tollsplit.costmanagement.ui.components.AdminPasswordDialog
import com.tollsplit.costmanagement.ui.screens.dashboard.TransactionRow
import com.tollsplit.costmanagement.ui.theme.BgDark
import com.tollsplit.costmanagement.ui.theme.BorderColor
import com.tollsplit.costmanagement.ui.theme.CardDark
import com.tollsplit.costmanagement.ui.theme.PrimaryTeal
import com.tollsplit.costmanagement.ui.theme.StatusDanger
import com.tollsplit.costmanagement.ui.theme.SurfaceDark
import com.tollsplit.costmanagement.ui.theme.SurfaceElevated
import com.tollsplit.costmanagement.ui.theme.TextMuted
import com.tollsplit.costmanagement.ui.theme.TextPrimary
import com.tollsplit.costmanagement.ui.theme.TextSecondary
import com.tollsplit.costmanagement.utils.ColorUtils
import com.tollsplit.costmanagement.utils.CurrencyUtils
import com.tollsplit.costmanagement.utils.DateUtils
import com.tollsplit.costmanagement.utils.PreferenceManager
import kotlinx.coroutines.launch

@Composable
fun HistoryScreen(
    prefManager: PreferenceManager,
    tripRepo: TripRepository,
    txRepo: TransactionRepository
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val activeGroupId = prefManager.activeGroupId ?: ""

    var selectedTabIndex by remember { mutableIntStateOf(0) } // 0 = Trips, 1 = Transactions, 2 = Report
    val tabs = listOf("Trips", "Transactions", "Monthly Report")

    val trips by tripRepo.getTripsFlow(activeGroupId).collectAsState(initial = emptyList())
    val transactions by txRepo.getTransactionsFlow(activeGroupId, 100).collectAsState(initial = emptyList())

    // Month Report State
    var reportMonth by remember { mutableIntStateOf(DateUtils.getCurrentMonth()) }
    var reportYear by remember { mutableIntStateOf(DateUtils.getCurrentYear()) }
    var reportData by remember { mutableStateOf(TripReport()) }

    // Trip Delete State
    var tripToDelete by remember { mutableStateOf<Trip?>(null) }
    var showAdminPasswordDialog by remember { mutableStateOf(false) }

    fun loadReport() {
        if (activeGroupId.isEmpty()) return
        val (start, end) = DateUtils.getMonthStartEnd(reportYear, reportMonth)
        coroutineScope.launch {
            reportData = tripRepo.getReportByDateRange(activeGroupId, start, end)
        }
    }

    LaunchedEffect(activeGroupId, reportMonth, reportYear, selectedTabIndex) {
        if (selectedTabIndex == 2) {
            loadReport()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
    ) {
        // Tab Row
        TabRow(
            selectedTabIndex = selectedTabIndex,
            containerColor = SurfaceDark,
            contentColor = PrimaryTeal,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    Modifier.tabIndicatorOffset(tabPositions[selectedTabIndex]),
                    color = PrimaryTeal
                )
            }
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTabIndex == index,
                    onClick = { selectedTabIndex = index },
                    text = {
                        Text(
                            text = title,
                            color = if (selectedTabIndex == index) PrimaryTeal else TextSecondary,
                            fontWeight = if (selectedTabIndex == index) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 13.sp
                        )
                    }
                )
            }
        }

        // Tab Content
        when (selectedTabIndex) {
            0 -> {
                // Trips Tab
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (trips.isEmpty()) {
                        item {
                            EmptyStateCard(message = "No trips logged yet in this group.")
                        }
                    } else {
                        items(trips, key = { it.id }) { trip ->
                            TripItemCard(
                                trip = trip,
                                onDeleteClick = { tripToDelete = trip }
                            )
                        }
                    }
                    item { Spacer(modifier = Modifier.height(32.dp)) }
                }
            }
            1 -> {
                // Transactions Tab
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (transactions.isEmpty()) {
                        item {
                            EmptyStateCard(message = "No transactions found.")
                        }
                    } else {
                        items(transactions, key = { it.id }) { tx ->
                            TransactionRow(tx)
                        }
                    }
                    item { Spacer(modifier = Modifier.height(32.dp)) }
                }
            }
            2 -> {
                // Monthly Report Tab
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Month Navigator
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .border(1.dp, BorderColor, RoundedCornerShape(14.dp)),
                            colors = CardDefaults.cardColors(containerColor = CardDark)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 8.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                IconButton(onClick = {
                                    if (reportMonth == 1) {
                                        reportMonth = 12
                                        reportYear -= 1
                                    } else {
                                        reportMonth -= 1
                                    }
                                }) {
                                    Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Month", tint = PrimaryTeal)
                                }

                                Text(
                                    text = "${DateUtils.getMonthName(reportMonth)} $reportYear",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextPrimary
                                )

                                IconButton(onClick = {
                                    if (reportMonth == 12) {
                                        reportMonth = 1
                                        reportYear += 1
                                    } else {
                                        reportMonth += 1
                                    }
                                }) {
                                    Icon(Icons.Default.ChevronRight, contentDescription = "Next Month", tint = PrimaryTeal)
                                }
                            }
                        }
                    }

                    // Summary Stats
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, BorderColor, RoundedCornerShape(14.dp)),
                                colors = CardDefaults.cardColors(containerColor = CardDark)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text("Total Toll", fontSize = 12.sp, color = TextSecondary)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        CurrencyUtils.formatCurrency(reportData.totalToll),
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = PrimaryTeal
                                    )
                                }
                            }

                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .border(1.dp, BorderColor, RoundedCornerShape(14.dp)),
                                colors = CardDefaults.cardColors(containerColor = CardDark)
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Text("Total Trips", fontSize = 12.sp, color = TextSecondary)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        "${reportData.tripCount}",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextPrimary
                                    )
                                }
                            }
                        }
                    }

                    // Member Spending Breakdown
                    item {
                        Text(
                            text = "Member Spending Breakdown",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    if (reportData.memberSpending.isEmpty()) {
                        item {
                            EmptyStateCard(message = "No member trip spending recorded for this month.")
                        }
                    } else {
                        items(reportData.memberSpending) { ms ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
                                colors = CardDefaults.cardColors(containerColor = CardDark)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .background(ColorUtils.parseHexColor(ms.avatarColor), CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = ms.memberName.take(1).uppercase(),
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(12.dp))

                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = ms.memberName,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 15.sp,
                                            color = TextPrimary
                                        )
                                        Text(
                                            text = "${ms.tripCount} trips",
                                            fontSize = 12.sp,
                                            color = TextSecondary
                                        )
                                    }

                                    Text(
                                        text = CurrencyUtils.formatCurrency(ms.totalSpent),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = PrimaryTeal
                                    )
                                }
                            }
                        }
                    }

                    item { Spacer(modifier = Modifier.height(32.dp)) }
                }
            }
        }
    }

    // Delete Trip Dialog (Confirmation + Password prompt)
    tripToDelete?.let { trip ->
        AlertDialog(
            onDismissRequest = { tripToDelete = null },
            containerColor = CardDark,
            title = {
                Text(
                    text = "Delete Trip?",
                    color = StatusDanger,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
            },
            text = {
                Column {
                    Text(
                        text = "Trip on ${DateUtils.formatDate(trip.trip_date)}",
                        color = TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Total Toll: ${CurrencyUtils.formatCurrency(trip.total_toll)}\n" +
                                "All ${trip.traveler_count} travelers will be refunded ${CurrencyUtils.formatCurrency(trip.per_person_cost)} each.\n\n" +
                                "Admin password will be required.",
                        color = TextSecondary,
                        fontSize = 13.sp
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showAdminPasswordDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = StatusDanger)
                ) {
                    Text("Proceed to Refund", color = Color.White, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { tripToDelete = null }) {
                    Text("Cancel", color = TextSecondary)
                }
            }
        )
    }

    if (showAdminPasswordDialog && tripToDelete != null) {
        val trip = tripToDelete!!
        AdminPasswordDialog(
            title = "Confirm Delete & Refund",
            message = "Enter the admin password to confirm deleting this trip and refunding all members.",
            onConfirm = {
                showAdminPasswordDialog = false
                tripToDelete = null
                coroutineScope.launch {
                    try {
                        tripRepo.deleteTrip(trip.id)
                        Toast.makeText(context, "Trip deleted and refunded!", Toast.LENGTH_SHORT).show()
                    } catch (e: Exception) {
                        Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            },
            onDismiss = {
                showAdminPasswordDialog = false
            }
        )
    }
}

@Composable
fun TripItemCard(trip: Trip, onDeleteClick: () -> Unit) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderColor, RoundedCornerShape(14.dp))
            .clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(containerColor = CardDark),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.DirectionsCar,
                        contentDescription = null,
                        tint = PrimaryTeal,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = DateUtils.formatDate(trip.trip_date),
                        color = TextPrimary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                }

                Text(
                    text = CurrencyUtils.formatCurrency(trip.total_toll),
                    color = PrimaryTeal,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${trip.traveler_count} travelers • ${CurrencyUtils.formatCurrency(trip.per_person_cost)} each",
                    color = TextSecondary,
                    fontSize = 13.sp
                )

                IconButton(
                    onClick = onDeleteClick,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete Trip",
                        tint = StatusDanger.copy(alpha = 0.8f),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            if (trip.note.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Note: ${trip.note}",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }

            // Expanded travelers preview
            if (expanded && trip.members.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SurfaceElevated, RoundedCornerShape(8.dp))
                        .padding(10.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            text = "Travelers in this trip:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextSecondary
                        )
                        trip.members.forEach { m ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .background(ColorUtils.parseHexColor(m.avatar_color), CircleShape)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(m.member_name, color = TextPrimary, fontSize = 13.sp)
                                }
                                Text(
                                    CurrencyUtils.formatCurrency(m.cost_share),
                                    color = TextSecondary,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyStateCard(message: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, BorderColor, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = CardDark)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = Icons.Default.ReceiptLong,
                contentDescription = null,
                tint = TextMuted,
                modifier = Modifier.size(36.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = message,
                color = TextMuted,
                fontSize = 14.sp
            )
        }
    }
}

package com.tollsplit.costmanagement

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.tollsplit.costmanagement.data.repository.DeviceRepository
import com.tollsplit.costmanagement.data.repository.GroupRepository
import com.tollsplit.costmanagement.data.repository.MemberRepository
import com.tollsplit.costmanagement.data.repository.NotificationRepository
import com.tollsplit.costmanagement.data.repository.TransactionRepository
import com.tollsplit.costmanagement.data.repository.TripRepository
import com.tollsplit.costmanagement.ui.components.UpdateDialog
import com.tollsplit.costmanagement.ui.navigation.BottomNavBar
import com.tollsplit.costmanagement.ui.navigation.Screen
import com.tollsplit.costmanagement.ui.screens.banned.BannedScreen
import com.tollsplit.costmanagement.ui.screens.dashboard.DashboardScreen
import com.tollsplit.costmanagement.ui.screens.history.HistoryScreen
import com.tollsplit.costmanagement.ui.screens.members.MembersScreen
import com.tollsplit.costmanagement.ui.screens.settings.SettingsScreen
import com.tollsplit.costmanagement.ui.screens.trip.TripScreen
import com.tollsplit.costmanagement.ui.theme.BgDark
import com.tollsplit.costmanagement.ui.theme.TollSplitTheme
import com.tollsplit.costmanagement.utils.AppUpdateManager
import com.tollsplit.costmanagement.utils.PreferenceManager
import com.tollsplit.costmanagement.utils.UpdateInfo

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val prefManager = PreferenceManager(this)
        val groupRepo = GroupRepository()
        val memberRepo = MemberRepository()
        val tripRepo = TripRepository()
        val txRepo = TransactionRepository()
        val deviceRepo = DeviceRepository()
        val notifRepo = NotificationRepository()

        setContent {
            TollSplitTheme {
                val context = LocalContext.current
                val deviceId = prefManager.deviceId
                val deviceUserName = prefManager.deviceUserName

                // Real-time ban monitoring
                val isBanned by deviceRepo.observeDeviceBan(deviceId).collectAsState(initial = false)

                // In-App Auto Update Check
                var updateInfo by remember { mutableStateOf<UpdateInfo?>(null) }
                var showUpdateDialog by remember { mutableStateOf(false) }

                LaunchedEffect(Unit) {
                    try {
                        val info = AppUpdateManager.checkForUpdate(context)
                        if (info.hasUpdate) {
                            updateInfo = info
                            showUpdateDialog = true
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                LaunchedEffect(deviceId, deviceUserName) {
                    try {
                        deviceRepo.registerDevice(deviceId, deviceUserName)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                if (isBanned) {
                    BannedScreen(deviceId = deviceId)
                } else {
                    MainAppContent(
                        prefManager = prefManager,
                        groupRepo = groupRepo,
                        memberRepo = memberRepo,
                        tripRepo = tripRepo,
                        txRepo = txRepo,
                        deviceRepo = deviceRepo,
                        notifRepo = notifRepo
                    )

                    if (showUpdateDialog && updateInfo != null) {
                        UpdateDialog(
                            updateInfo = updateInfo!!,
                            onDismiss = { showUpdateDialog = false }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MainAppContent(
    prefManager: PreferenceManager,
    groupRepo: GroupRepository,
    memberRepo: MemberRepository,
    tripRepo: TripRepository,
    txRepo: TransactionRepository,
    deviceRepo: DeviceRepository,
    notifRepo: NotificationRepository
) {
    val navController = rememberNavController()

    Scaffold(
        containerColor = BgDark,
        bottomBar = {
            BottomNavBar(navController = navController)
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            NavHost(
                navController = navController,
                startDestination = Screen.Dashboard.route
            ) {
                composable(Screen.Dashboard.route) {
                    DashboardScreen(
                        navController = navController,
                        prefManager = prefManager,
                        groupRepo = groupRepo,
                        memberRepo = memberRepo,
                        txRepo = txRepo,
                        notifRepo = notifRepo
                    )
                }
                composable(Screen.Trip.route) {
                    TripScreen(
                        prefManager = prefManager,
                        groupRepo = groupRepo,
                        memberRepo = memberRepo,
                        tripRepo = tripRepo
                    )
                }
                composable(Screen.Members.route) {
                    MembersScreen(
                        prefManager = prefManager,
                        memberRepo = memberRepo
                    )
                }
                composable(Screen.History.route) {
                    HistoryScreen(
                        prefManager = prefManager,
                        tripRepo = tripRepo,
                        txRepo = txRepo
                    )
                }
                composable(Screen.Settings.route) {
                    SettingsScreen(
                        prefManager = prefManager,
                        groupRepo = groupRepo,
                        deviceRepo = deviceRepo,
                        notifRepo = notifRepo
                    )
                }
            }
        }
    }
}

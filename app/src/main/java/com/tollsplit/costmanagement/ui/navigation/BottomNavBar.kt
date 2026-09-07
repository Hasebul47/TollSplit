package com.tollsplit.costmanagement.ui.navigation

import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import com.tollsplit.costmanagement.ui.theme.BorderColor
import com.tollsplit.costmanagement.ui.theme.PrimaryTeal
import com.tollsplit.costmanagement.ui.theme.TabBarActive
import com.tollsplit.costmanagement.ui.theme.TabBarBg
import com.tollsplit.costmanagement.ui.theme.TabBarInactive
import com.tollsplit.costmanagement.ui.theme.TextPrimary

@Composable
fun BottomNavBar(navController: NavController) {
    val navBackStackEntry = navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry.value?.destination?.route

    NavigationBar(
        containerColor = TabBarBg,
        tonalElevation = 8.dp
    ) {
        Screen.items.forEach { screen ->
            val selected = currentRoute == screen.route
            NavigationBarItem(
                selected = selected,
                onClick = {
                    if (currentRoute != screen.route) {
                        navController.navigate(screen.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                icon = {
                    Icon(
                        imageVector = screen.icon,
                        contentDescription = screen.title
                    )
                },
                label = { Text(screen.title) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = TabBarActive,
                    selectedTextColor = TabBarActive,
                    unselectedIconColor = TabBarInactive,
                    unselectedTextColor = TabBarInactive,
                    indicatorColor = TabBarBg
                )
            )
        }
    }
}

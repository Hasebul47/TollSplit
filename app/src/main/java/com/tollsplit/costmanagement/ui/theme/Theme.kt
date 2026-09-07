package com.tollsplit.costmanagement.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryTeal,
    onPrimary = BgDark,
    primaryContainer = PrimaryDark,
    onPrimaryContainer = TextPrimary,
    secondary = AccentCyan,
    onSecondary = BgDark,
    background = BgDark,
    onBackground = TextPrimary,
    surface = SurfaceDark,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceElevated,
    onSurfaceVariant = TextSecondary,
    outline = BorderColor,
    error = StatusDanger,
    onError = TextPrimary
)

@Composable
fun TollSplitTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}

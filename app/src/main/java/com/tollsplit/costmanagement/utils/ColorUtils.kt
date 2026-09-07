package com.tollsplit.costmanagement.utils

import androidx.compose.ui.graphics.Color

object ColorUtils {

    private val avatarPalette = listOf(
        "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
        "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
    )

    fun getRandomAvatarColor(): String {
        return avatarPalette.random()
    }

    fun parseHexColor(hexString: String, fallback: Color = Color(0xFF10B981)): Color {
        return try {
            val cleanHex = hexString.removePrefix("#")
            val colorInt = when (cleanHex.length) {
                6 -> "FF$cleanHex".toLong(16)
                8 -> cleanHex.toLong(16)
                else -> return fallback
            }
            Color(colorInt)
        } catch (e: Exception) {
            fallback
        }
    }
}

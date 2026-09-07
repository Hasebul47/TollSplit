package com.tollsplit.costmanagement.utils

import androidx.compose.ui.graphics.Color
import java.text.DecimalFormat
import java.text.DecimalFormatSymbols
import java.util.Locale
import kotlin.math.abs

object CurrencyUtils {

    fun formatCurrency(amount: Double, currency: String = "BDT"): String {
        val isNegative = amount < 0
        val absNum = abs(amount)

        val symbols = DecimalFormatSymbols(Locale.US).apply {
            groupingSeparator = ','
            decimalSeparator = '.'
        }

        val pattern = if (absNum % 1.0 == 0.0) "#,##0" else "#,##0.00"
        val formatter = DecimalFormat(pattern, symbols)
        val formattedNumber = formatter.format(absNum)

        return if (isNegative) "-$formattedNumber $currency" else "$formattedNumber $currency"
    }

    fun formatNumber(num: Double): String {
        val symbols = DecimalFormatSymbols(Locale.US).apply {
            groupingSeparator = ','
        }
        val formatter = DecimalFormat("#,##0", symbols)
        return formatter.format(num)
    }

    fun getBalanceColor(balance: Double): Color {
        return when {
            balance < 0 -> Color(0xFFDC2626)
            balance < 50 -> Color(0xFFEF4444)
            balance < 100 -> Color(0xFFF59E0B)
            balance < 200 -> Color(0xFFEAB308)
            else -> Color(0xFF22C55E)
        }
    }

    fun getBalanceStatus(balance: Double): String {
        return when {
            balance < 0 -> "Negative"
            balance < 50 -> "Critical"
            balance < 100 -> "Low"
            balance < 200 -> "Medium"
            else -> "Good"
        }
    }
}

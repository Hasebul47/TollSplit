package com.tollsplit.costmanagement.utils

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object DateUtils {

    private val ymdFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val displayDateFormat = SimpleDateFormat("EEE, MMM d, yyyy", Locale.US)
    private val dateTimeFormat = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.US)
    private val timeFormat = SimpleDateFormat("hh:mm a", Locale.US)

    fun getToday(): String {
        return ymdFormat.format(Date())
    }

    fun formatDate(dateStr: String): String {
        return try {
            val d = ymdFormat.parse(dateStr)
            if (d != null) displayDateFormat.format(d) else dateStr
        } catch (e: Exception) {
            dateStr
        }
    }

    fun formatDateTime(date: Date?): String {
        if (date == null) return ""
        return try {
            dateTimeFormat.format(date)
        } catch (e: Exception) {
            ""
        }
    }

    fun formatTime(date: Date?): String {
        if (date == null) return ""
        return try {
            timeFormat.format(date)
        } catch (e: Exception) {
            ""
        }
    }

    fun getRelativeTime(date: Date?): String {
        if (date == null) return ""
        val now = System.currentTimeMillis()
        val diff = now - date.time
        val minutes = diff / (60 * 1000)
        val hours = diff / (60 * 60 * 1000)
        val days = diff / (24 * 60 * 60 * 1000)

        return when {
            minutes < 1 -> "Just now"
            minutes < 60 -> "${minutes}m ago"
            hours < 24 -> "${hours}h ago"
            days < 7 -> "${days}d ago"
            else -> formatDateTime(date)
        }
    }

    fun getCurrentMonth(): Int {
        return Calendar.getInstance().get(Calendar.MONTH) + 1
    }

    fun getCurrentYear(): Int {
        return Calendar.getInstance().get(Calendar.YEAR)
    }

    fun getMonthName(month: Int): String {
        val names = arrayOf(
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        )
        return if (month in 1..12) names[month - 1] else ""
    }

    fun getMonthStartEnd(year: Int, month: Int): Pair<String, String> {
        val cal = Calendar.getInstance()
        cal.set(Calendar.YEAR, year)
        cal.set(Calendar.MONTH, month - 1)
        cal.set(Calendar.DAY_OF_MONTH, 1)
        val start = ymdFormat.format(cal.time)

        val lastDay = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
        cal.set(Calendar.DAY_OF_MONTH, lastDay)
        val end = ymdFormat.format(cal.time)

        return Pair(start, end)
    }
}

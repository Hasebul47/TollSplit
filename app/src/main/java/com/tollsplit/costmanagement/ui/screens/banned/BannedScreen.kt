package com.tollsplit.costmanagement.ui.screens.banned

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Block
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tollsplit.costmanagement.ui.theme.BgDark
import com.tollsplit.costmanagement.ui.theme.BorderColor
import com.tollsplit.costmanagement.ui.theme.CardDark
import com.tollsplit.costmanagement.ui.theme.PrimaryTeal
import com.tollsplit.costmanagement.ui.theme.StatusDanger
import com.tollsplit.costmanagement.ui.theme.StatusDangerBg
import com.tollsplit.costmanagement.ui.theme.TextPrimary
import com.tollsplit.costmanagement.ui.theme.TextSecondary

@Composable
fun BannedScreen(deviceId: String) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgDark)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(StatusDangerBg, CircleShape)
                .border(1.dp, StatusDanger.copy(alpha = 0.3f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Block,
                contentDescription = null,
                tint = StatusDanger,
                modifier = Modifier.size(54.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "Access Denied",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = StatusDanger
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = "This device has been restricted from accessing TollSplit by the administrator. If you believe this is a mistake, please contact your administrator.",
            fontSize = 14.sp,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 22.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BorderColor, RoundedCornerShape(12.dp))
                .clickable {
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    val clip = ClipData.newPlainText("Device ID", deviceId)
                    clipboard.setPrimaryClip(clip)
                    Toast.makeText(context, "Device ID copied to clipboard", Toast.LENGTH_SHORT).show()
                },
            colors = CardDefaults.cardColors(containerColor = CardDark),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Your Device ID (Tap to Copy):",
                    fontSize = 12.sp,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = deviceId,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = PrimaryTeal,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

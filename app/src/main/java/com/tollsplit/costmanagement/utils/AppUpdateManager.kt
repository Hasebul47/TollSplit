package com.tollsplit.costmanagement.utils

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

data class UpdateInfo(
    val hasUpdate: Boolean = false,
    val currentVersion: String = "",
    val latestVersion: String = "",
    val downloadUrl: String = "",
    val releaseNotes: String = "",
    val isForceUpdate: Boolean = false
)

object AppUpdateManager {

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private const val GITHUB_REPO_OWNER = "Hasebul47"
    private const val GITHUB_REPO_NAME = "TollSplit"

    suspend fun checkForUpdate(context: Context): UpdateInfo = withContext(Dispatchers.IO) {
        val currentVersion = getCurrentVersionName(context)

        // 1. First check GitHub Releases API
        val gitHubUpdate = checkGitHubReleases(currentVersion)
        if (gitHubUpdate.hasUpdate) {
            return@withContext gitHubUpdate
        }

        // 2. Secondary/Fallback check: Firestore `app_config/update`
        val firestoreUpdate = checkFirestoreUpdate(currentVersion)
        if (firestoreUpdate.hasUpdate) {
            return@withContext firestoreUpdate
        }

        return@withContext UpdateInfo(
            hasUpdate = false,
            currentVersion = currentVersion,
            latestVersion = currentVersion
        )
    }

    private fun checkGitHubReleases(currentVersion: String): UpdateInfo {
        return try {
            val url = "https://api.github.com/repos/$GITHUB_REPO_OWNER/$GITHUB_REPO_NAME/releases/latest"
            val request = Request.Builder()
                .url(url)
                .header("Accept", "application/vnd.github.v3+json")
                .header("User-Agent", "TollSplit-Android-App")
                .build()

            val response = client.newCall(request).execute()
            if (!response.isSuccessful) {
                return UpdateInfo(hasUpdate = false, currentVersion = currentVersion)
            }

            val body = response.body?.string() ?: return UpdateInfo(hasUpdate = false, currentVersion = currentVersion)
            val json = JSONObject(body)

            val rawTag = json.optString("tag_name", "")
            val latestVersion = rawTag.removePrefix("v").trim()
            val releaseNotes = json.optString("body", "Bug fixes and performance improvements.")

            // Find APK in assets
            var downloadUrl = ""
            val assets = json.optJSONArray("assets")
            if (assets != null) {
                for (i in 0 until assets.length()) {
                    val asset = assets.getJSONObject(i)
                    val name = asset.optString("name", "")
                    if (name.endsWith(".apk", ignoreCase = true)) {
                        downloadUrl = asset.optString("browser_download_url", "")
                        break
                    }
                }
            }

            if (downloadUrl.isEmpty()) {
                downloadUrl = json.optString("html_url", "")
            }

            val hasUpdate = isNewerVersion(currentVersion, latestVersion)

            UpdateInfo(
                hasUpdate = hasUpdate,
                currentVersion = currentVersion,
                latestVersion = latestVersion,
                downloadUrl = downloadUrl,
                releaseNotes = releaseNotes,
                isForceUpdate = false
            )
        } catch (e: Exception) {
            UpdateInfo(hasUpdate = false, currentVersion = currentVersion)
        }
    }

    private suspend fun checkFirestoreUpdate(currentVersion: String): UpdateInfo {
        return try {
            val doc = FirebaseFirestore.getInstance()
                .collection("app_config")
                .document("update")
                .get()
                .await()

            if (doc.exists()) {
                val latestVersion = doc.getString("latest_version_name") ?: currentVersion
                val downloadUrl = doc.getString("apk_url") ?: ""
                val releaseNotes = doc.getString("release_notes") ?: "A new update is available."
                val isForceUpdate = doc.getBoolean("is_force_update") ?: false

                val hasUpdate = isNewerVersion(currentVersion, latestVersion) && downloadUrl.isNotEmpty()

                UpdateInfo(
                    hasUpdate = hasUpdate,
                    currentVersion = currentVersion,
                    latestVersion = latestVersion,
                    downloadUrl = downloadUrl,
                    releaseNotes = releaseNotes,
                    isForceUpdate = isForceUpdate
                )
            } else {
                UpdateInfo(hasUpdate = false, currentVersion = currentVersion)
            }
        } catch (e: Exception) {
            UpdateInfo(hasUpdate = false, currentVersion = currentVersion)
        }
    }

    fun getCurrentVersionName(context: Context): String {
        return try {
            @Suppress("DEPRECATION")
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            pInfo.versionName ?: "1.0.0"
        } catch (e: Exception) {
            "1.0.0"
        }
    }

    fun isNewerVersion(current: String, latest: String): Boolean {
        if (latest.isBlank()) return false
        val currParts = current.removePrefix("v").split(".").mapNotNull { it.toIntOrNull() }
        val latestParts = latest.removePrefix("v").split(".").mapNotNull { it.toIntOrNull() }

        val length = maxOf(currParts.size, latestParts.size)
        for (i in 0 until length) {
            val c = currParts.getOrElse(i) { 0 }
            val l = latestParts.getOrElse(i) { 0 }
            if (l > c) return true
            if (l < c) return false
        }
        return false
    }
}

package com.tollsplit.costmanagement

import android.app.Application
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions

class TollSplitApp : Application() {

    override fun onCreate() {
        super.onCreate()

        // Initialize Firebase if not already initialized by google-services
        if (FirebaseApp.getApps(this).isEmpty()) {
            val options = FirebaseOptions.Builder()
                .setApplicationId("1:144464043325:android:d6438a22ec208f870a6c0b")
                .setApiKey("AIzaSyBscDwGwJv6Z-V_QnRaBbVnIlp8rL_yw0M")
                .setProjectId("tollsplit-277bf")
                .setGcmSenderId("144464043325")
                .setStorageBucket("tollsplit-277bf.firebasestorage.app")
                .build()

            FirebaseApp.initializeApp(this, options)
        }
    }
}

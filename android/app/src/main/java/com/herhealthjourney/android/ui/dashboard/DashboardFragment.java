package com.herhealthjourney.android.ui.dashboard;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.google.gson.JsonObject;
import com.herhealthjourney.android.R;
import com.herhealthjourney.android.api.ApiClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardFragment extends Fragment {

    private TextView tvWelcome, tvPeriodEstimate, tvWaterAmount, tvLatestMood, tvRecentSymptom;
    private ProgressBar pbWaterProgress;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_dashboard, container, false);
        tvWelcome = view.findViewById(R.id.tvWelcomeUser);
        tvPeriodEstimate = view.findViewById(R.id.tvPeriodEstimate);
        tvWaterAmount = view.findViewById(R.id.tvWaterAmount);
        pbWaterProgress = view.findViewById(R.id.pbWaterProgress);
        tvLatestMood = view.findViewById(R.id.tvLatestMood);
        tvRecentSymptom = view.findViewById(R.id.tvRecentSymptom);

        loadDashboardData();
        return view;
    }

    private void loadDashboardData() {
        if (getContext() == null) return;
        ApiClient.getService(getContext()).getDashboard().enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    JsonObject data = response.body();

                    if (data.has("userProfile") && data.getAsJsonObject("userProfile").has("firstName")) {
                        tvWelcome.setText("Welcome, " + data.getAsJsonObject("userProfile").get("firstName").getAsString());
                    }

                    if (data.has("periodSummary")) {
                        JsonObject period = data.getAsJsonObject("periodSummary");
                        if (period.has("estimatedNextPeriodStart") && !period.get("estimatedNextPeriodStart").isJsonNull()) {
                            tvPeriodEstimate.setText("Estimated Next: " + period.get("estimatedNextPeriodStart").getAsString());
                        } else {
                            tvPeriodEstimate.setText("Cycle: " + period.get("averageCycleLengthDays").getAsInt() + " days");
                        }
                    }

                    if (data.has("waterProgress")) {
                        JsonObject water = data.getAsJsonObject("waterProgress");
                        int current = water.get("currentAmountMl").getAsInt();
                        int goal = water.get("dailyGoalMl").getAsInt();
                        int percent = water.get("percentageCompleted").getAsInt();
                        tvWaterAmount.setText(current + " / " + goal + " ml (" + percent + "%)");
                        pbWaterProgress.setProgress(percent);
                    }

                    if (data.has("latestWellness") && !data.get("latestWellness").isJsonNull()) {
                        JsonObject well = data.getAsJsonObject("latestWellness");
                        tvLatestMood.setText("Mood: " + well.get("mood").getAsString() + " • Sleep: " + well.get("sleepHours").getAsString() + "h");
                    }
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                if (tvWelcome != null) {
                    tvWelcome.setText("Offline Mode");
                }
            }
        });
    }
}


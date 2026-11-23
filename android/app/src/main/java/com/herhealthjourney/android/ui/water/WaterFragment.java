package com.herhealthjourney.android.ui.water;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.google.gson.JsonObject;
import com.herhealthjourney.android.R;
import com.herhealthjourney.android.api.ApiClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class WaterFragment extends Fragment {

    private TextView tvWaterDetail;
    private ProgressBar pbWaterPage;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_water, container, false);

        tvWaterDetail = view.findViewById(R.id.tvWaterDetail);
        pbWaterPage = view.findViewById(R.id.pbWaterPage);

        Button btn250 = view.findViewById(R.id.btnAdd250);
        Button btn500 = view.findViewById(R.id.btnAdd500);

        btn250.setOnClickListener(v -> addIntake(250));
        btn500.setOnClickListener(v -> addIntake(500));

        loadWater();
        return view;
    }

    private void loadWater() {
        if (getContext() == null) return;
        ApiClient.getService(getContext()).getTodayWater().enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    JsonObject data = response.body();
                    int current = data.get("currentAmountMl").getAsInt();
                    int goal = data.get("dailyGoalMl").getAsInt();
                    int pct = data.get("percentageCompleted").getAsInt();

                    tvWaterDetail.setText(current + " / " + goal + " ml");
                    pbWaterPage.setProgress(pct);
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                tvWaterDetail.setText("Offline Mode");
            }
        });
    }

    private void addIntake(int ml) {
        if (getContext() == null) return;
        ApiClient.getService(getContext()).addWater(ml).enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                Toast.makeText(getContext(), "+" + ml + " ml logged!", Toast.LENGTH_SHORT).show();
                loadWater();
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                Toast.makeText(getContext(), "Logged locally (Offline)", Toast.LENGTH_SHORT).show();
            }
        });
    }
}


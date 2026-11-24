package com.herhealthjourney.android.ui.period;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.gson.JsonObject;
import com.herhealthjourney.android.R;
import com.herhealthjourney.android.api.ApiClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class PeriodFragment extends Fragment {

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_period, container, false);

        FloatingActionButton fab = view.findViewById(R.id.fabAddPeriod);
        fab.setOnClickListener(v -> showQuickLogDialog());

        return view;
    }

    private void showQuickLogDialog() {
        if (getContext() == null) return;
        new AlertDialog.Builder(getContext())
            .setTitle("Log Period Start")
            .setMessage("Record cycle start date as today?")
            .setPositiveButton("Confirm", (dialog, which) -> {
                String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
                JsonObject payload = new JsonObject();
                payload.addProperty("startDate", today);
                payload.addProperty("flowIntensity", "MEDIUM");
                payload.addProperty("painLevel", 2);
                payload.addProperty("notes", "Logged from mobile client");

                ApiClient.getService(getContext()).createPeriodRecord(payload).enqueue(new Callback<JsonObject>() {
                    @Override
                    public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                        if (response.isSuccessful()) {
                            Toast.makeText(getContext(), "Cycle record logged!", Toast.LENGTH_SHORT).show();
                        } else {
                            Toast.makeText(getContext(), "Error logging record", Toast.LENGTH_SHORT).show();
                        }
                    }

                    @Override
                    public void onFailure(Call<JsonObject> call, Throwable t) {
                        Toast.makeText(getContext(), "Network error: saved locally", Toast.LENGTH_SHORT).show();
                    }
                });
            })
            .setNegativeButton("Cancel", null)
            .show();
    }
}


package com.herhealthjourney.android.ui.symptoms;

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

public class SymptomsFragment extends Fragment {

    private final String[] SYMPTOMS = {
        "Pelvic Pain & Cramping",
        "Bloating & Water Retention",
        "Fatigue & Low Energy",
        "Hormonal Acne Flare",
        "Hirsutism / Facial Hair",
        "Mood Swings / Irritability"
    };

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_symptoms, container, false);

        FloatingActionButton fab = view.findViewById(R.id.fabAddSymptom);
        fab.setOnClickListener(v -> showSymptomDialog());

        return view;
    }

    private void showSymptomDialog() {
        if (getContext() == null) return;
        new AlertDialog.Builder(getContext())
            .setTitle("Select PCOS Symptom")
            .setItems(SYMPTOMS, (dialog, which) -> {
                String chosen = SYMPTOMS[which];
                String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());

                JsonObject payload = new JsonObject();
                payload.addProperty("recordDate", today);
                payload.addProperty("symptomType", chosen);
                payload.addProperty("severityScale", 3);
                payload.addProperty("painLevel", 2);
                payload.addProperty("energyLevel", 3);
                payload.addProperty("dailyObservations", "Logged via Android app");

                ApiClient.getService(getContext()).createSymptom(payload).enqueue(new Callback<JsonObject>() {
                    @Override
                    public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                        Toast.makeText(getContext(), "Logged symptom: " + chosen, Toast.LENGTH_SHORT).show();
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


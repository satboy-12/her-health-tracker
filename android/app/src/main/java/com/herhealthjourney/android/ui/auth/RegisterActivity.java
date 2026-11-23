package com.herhealthjourney.android.ui.auth;

import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.textfield.TextInputEditText;
import com.google.gson.JsonObject;
import com.herhealthjourney.android.R;
import com.herhealthjourney.android.api.ApiClient;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        TextInputEditText etUsername = findViewById(R.id.etRegUsername);
        TextInputEditText etEmail = findViewById(R.id.etRegEmail);
        TextInputEditText etFirstName = findViewById(R.id.etRegFirstName);
        TextInputEditText etLastName = findViewById(R.id.etRegLastName);
        TextInputEditText etPassword = findViewById(R.id.etRegPassword);
        Button btnRegister = findViewById(R.id.btnRegisterSubmit);

        btnRegister.setOnClickListener(v -> {
            String username = etUsername.getText() != null ? etUsername.getText().toString().trim() : "";
            String email = etEmail.getText() != null ? etEmail.getText().toString().trim() : "";
            String firstName = etFirstName.getText() != null ? etFirstName.getText().toString().trim() : "";
            String lastName = etLastName.getText() != null ? etLastName.getText().toString().trim() : "";
            String password = etPassword.getText() != null ? etPassword.getText().toString().trim() : "";

            if (username.isEmpty() || email.isEmpty() || firstName.isEmpty() || lastName.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show();
                return;
            }

            JsonObject payload = new JsonObject();
            payload.addProperty("username", username);
            payload.addProperty("email", email);
            payload.addProperty("firstName", firstName);
            payload.addProperty("lastName", lastName);
            payload.addProperty("password", password);

            btnRegister.setEnabled(false);
            btnRegister.setText("Creating account...");

            ApiClient.getService(this).register(payload).enqueue(new Callback<JsonObject>() {
                @Override
                public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                    btnRegister.setEnabled(true);
                    btnRegister.setText("Register");

                    if (response.isSuccessful()) {
                        Toast.makeText(RegisterActivity.this, "Account created! Please log in.", Toast.LENGTH_LONG).show();
                        finish();
                    } else {
                        Toast.makeText(RegisterActivity.this, "Registration failed. Username or email may exist.", Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<JsonObject> call, Throwable t) {
                    btnRegister.setEnabled(true);
                    btnRegister.setText("Register");
                    Toast.makeText(RegisterActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        });
    }
}


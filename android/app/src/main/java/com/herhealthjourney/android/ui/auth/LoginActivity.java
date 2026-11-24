package com.herhealthjourney.android.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.textfield.TextInputEditText;
import com.google.gson.JsonObject;
import com.herhealthjourney.android.R;
import com.herhealthjourney.android.api.ApiClient;
import com.herhealthjourney.android.ui.MainActivity;
import com.herhealthjourney.android.util.SecureTokenManager;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        TextInputEditText etUsername = findViewById(R.id.etUsername);
        TextInputEditText etPassword = findViewById(R.id.etPassword);
        Button btnLogin = findViewById(R.id.btnLogin);
        TextView tvRegister = findViewById(R.id.tvRegisterLink);

        tvRegister.setOnClickListener(v -> startActivity(new Intent(this, RegisterActivity.class)));

        btnLogin.setOnClickListener(v -> {
            String username = etUsername.getText() != null ? etUsername.getText().toString().trim() : "";
            String password = etPassword.getText() != null ? etPassword.getText().toString().trim() : "";

            if (username.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please enter your username and password", Toast.LENGTH_SHORT).show();
                return;
            }

            JsonObject payload = new JsonObject();
            payload.addProperty("usernameOrEmail", username);
            payload.addProperty("password", password);

            btnLogin.setEnabled(false);
            btnLogin.setText("Signing in...");

            ApiClient.getService(this).login(payload).enqueue(new Callback<JsonObject>() {
                @Override
                public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                    btnLogin.setEnabled(true);
                    btnLogin.setText("Sign In");

                    if (response.isSuccessful() && response.body() != null) {
                        JsonObject data = response.body();
                        String token = data.get("token").getAsString();
                        String user = data.has("username") ? data.get("username").getAsString() : username;

                        SecureTokenManager tokenManager = new SecureTokenManager(LoginActivity.this);
                        tokenManager.saveAuth(token, user);

                        Toast.makeText(LoginActivity.this, "Welcome, " + user, Toast.LENGTH_SHORT).show();
                        startActivity(new Intent(LoginActivity.this, MainActivity.class));
                        finish();
                    } else {
                        Toast.makeText(LoginActivity.this, "Authentication failed. Check credentials.", Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<JsonObject> call, Throwable t) {
                    btnLogin.setEnabled(true);
                    btnLogin.setText("Sign In");
                    Toast.makeText(LoginActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
                }
            });
        });
    }
}


package com.herhealthjourney;

import com.herhealthjourney.dto.AuthResponse;
import com.herhealthjourney.dto.RegisterRequest;
import com.herhealthjourney.entity.User;
import com.herhealthjourney.exception.BadRequestException;
import com.herhealthjourney.repository.UserRepository;
import com.herhealthjourney.security.JwtTokenProvider;
import com.herhealthjourney.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    void testRegister_success() {
        RegisterRequest req = new RegisterRequest("jane_doe", "jane@test.com", "Secret123!", "Jane", "Doe", LocalDate.of(1998, 3, 20));

        when(userRepository.existsByUsername("jane_doe")).thenReturn(false);
        when(userRepository.existsByEmail("jane@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret123!")).thenReturn("$2a$12$hashedPassword");

        User saved = new User("jane_doe", "jane@test.com", "$2a$12$hashedPassword", "Jane", "Doe", LocalDate.of(1998, 3, 20));
        saved.setId(10L);
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(tokenProvider.generateToken("jane_doe")).thenReturn("mock-jwt-token");

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertEquals("jane_doe", resp.username());
        assertEquals("mock-jwt-token", resp.token());
        assertEquals("Bearer", resp.tokenType());
    }

    @Test
    void testRegister_duplicateUsername_throwsException() {
        RegisterRequest req = new RegisterRequest("existing_user", "new@test.com", "Secret123!", "Jane", "Doe", null);
        when(userRepository.existsByUsername("existing_user")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(req));
    }
}


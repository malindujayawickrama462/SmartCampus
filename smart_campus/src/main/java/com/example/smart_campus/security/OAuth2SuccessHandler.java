package com.example.smart_campus.security;

import com.example.smart_campus.model.RefreshToken;
import com.example.smart_campus.model.Role;
import com.example.smart_campus.model.User;
import com.example.smart_campus.repository.RefreshTokenRepository;
import com.example.smart_campus.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Handles successful OAuth2 authentication (e.g., Google Sign-In).
 * - Finds or creates the user in the database.
 * - Updates the avatar URL on each login.
 * - Issues a JWT access token and a refresh token.
 * - Redirects the frontend to /oauth2/callback with the tokens as query params.
 */
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh.expiration:604800000}")
    private int refreshTokenExpirationMs;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public OAuth2SuccessHandler(UserRepository userRepository,
                                JwtUtils jwtUtils,
                                RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email    = oauthUser.getAttribute("email");
        String name     = oauthUser.getAttribute("name");
        String picture  = oauthUser.getAttribute("picture");
        String sub      = oauthUser.getAttribute("sub"); // Google's unique user ID

        // Find the user or create a new one (first-time Google login → auto-register as USER)
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .name(name != null ? name : email)
                    .avatarUrl(picture)
                    .role(Role.USER)
                    .provider("google")
                    .providerId(sub)
                    .build();
            return userRepository.save(newUser);
        });

        // Block deactivated accounts from signing in via OAuth2
        if (!user.isActive()) {
            String redirectUrl = frontendUrl + "/login?error=account_deactivated";
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            return;
        }

        // Keep avatar URL and providerId in sync
        boolean dirty = false;
        if (picture != null && !picture.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(picture);
            dirty = true;
        }
        if (sub != null && !sub.equals(user.getProviderId())) {
            user.setProviderId(sub);
            dirty = true;
        }
        if (dirty) {
            userRepository.save(user);
        }

        // Issue tokens
        String accessToken  = jwtUtils.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        RefreshToken refreshToken = createRefreshToken(user);

        // Redirect to the frontend callback page with tokens
        String redirectUrl = frontendUrl + "/oauth2/callback?token=" + accessToken
                + "&refreshToken=" + refreshToken.getToken();
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private RefreshToken createRefreshToken(User user) {
        LocalDateTime expiryDate = LocalDateTime.now().plusSeconds(refreshTokenExpirationMs / 1000L);
        String token = jwtUtils.generateRefreshToken(user.getEmail(), user.getId());
        RefreshToken refreshToken = new RefreshToken(user, token, expiryDate);
        return refreshTokenRepository.save(refreshToken);
    }
}

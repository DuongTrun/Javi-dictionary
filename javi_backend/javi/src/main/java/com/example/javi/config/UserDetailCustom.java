package com.example.javi.config;

import java.util.HashSet;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.repository.UsersRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Component("userDetailsService")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserDetailCustom implements UserDetailsService {
    UsersRepository usersRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Users user =
                usersRepository.findByEmail(username).orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + username));

        // Tập hợp quyền
        Set<GrantedAuthority> authorities = new HashSet<>();
        if (user.getRole() != null) {
            // Thêm quyền ROLE_*
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));

            // Thêm các permission (nếu có)
            user.getRole().getPermissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p.getName())));
        }

        return new User(user.getEmail(), user.getPassword(), authorities);
    }
}

# Authentication Flow SOP

**Purpose:** Define the authentication process, session management, and user profile handling.

---

## Goals

1. Securely authenticate users via email/password or OAuth
2. Maintain persistent sessions across page reloads
3. Automatically fetch and cache user profile data
4. Handle logout and session expiration gracefully

---

## Inputs

### User Credentials (Email/Password)
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### OAuth Provider
```json
{
  "provider": "google" | "github"
}
```

---

## Process Flow

### 1. Initial Session Check
**Location:** `AuthContext.js` → `useEffect` hook

```javascript
const checkSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    setUser(session.user);
    await fetchProfile(session.user.id);
  }
  setLoading(false);
};
```

**Edge Cases:**
- No session exists → `user` remains `null`, show login screen
- Session expired → Supabase auto-refreshes if refresh token valid
- Network error → Catch and log, set `loading` to `false`

---

### 2. Email/Password Sign-In
**Location:** `LoginScreen.jsx` → `handleSubmit`

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (error) {
  if (error.message.includes('Invalid login credentials')) {
    // User doesn't exist, try sign-up
    await handleSignUp(email, password, name);
  } else {
    alert('שגיאה בהתחברות: ' + error.message);
  }
}
```

**Edge Cases:**
- User doesn't exist → Automatically attempt sign-up
- Invalid password → Show Hebrew error message
- Email not confirmed → Supabase handles confirmation flow

---

### 3. Sign-Up (New User)
**Location:** `LoginScreen.jsx` → `handleSignUp`

```javascript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { name }  // Stored in auth.users metadata
  }
});

if (!error) {
  // Create profile record
  await supabase.from('profiles').insert({
    id: data.user.id,
    name,
    base_chronotype: null
  });
}
```

**Edge Cases:**
- Email already exists → Supabase returns error
- Profile creation fails → User can still log in, profile created on next login
- Email confirmation required → Depends on Supabase project settings

---

### 4. OAuth Sign-In
**Location:** `LoginScreen.jsx` → `handleOAuth`

```javascript
const { error } = await supabase.auth.signInWithOAuth({
  provider,
  options: {
    redirectTo: window.location.origin
  }
});
```

**Edge Cases:**
- Popup blocked → Supabase falls back to redirect
- User cancels OAuth flow → No error, just return to login
- First-time OAuth user → Profile auto-created by Supabase trigger (if configured)

---

### 5. Profile Fetching
**Location:** `AuthContext.js` → `fetchProfile`

```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .maybeSingle();

if (!error && data) {
  setUserData(data);
}
```

**Edge Cases:**
- Profile doesn't exist → Create it on-the-fly
- Multiple profiles (shouldn't happen) → `maybeSingle()` returns first
- Database error → Log and continue (user can still use app)

---

### 6. Auth State Listener
**Location:** `AuthContext.js` → `onAuthStateChange`

```javascript
supabase.auth.onAuthStateChange(async (_event, session) => {
  setUser(session?.user ?? null);
  if (session?.user) {
    await fetchProfile(session.user.id);
  } else {
    setUserData(null);
  }
});
```

**Events:**
- `SIGNED_IN` → Fetch profile
- `SIGNED_OUT` → Clear user data
- `TOKEN_REFRESHED` → No action needed (automatic)
- `USER_UPDATED` → Re-fetch profile

---

### 7. Logout
**Location:** `MainLayout.jsx` → `handleLogout`

```javascript
if (window.confirm('Are you sure you want to logout?')) {
  await supabase.auth.signOut();
}
```

**Edge Cases:**
- Network error during sign-out → Local session still cleared
- User cancels confirmation → No action

---

## Outputs

### Successful Authentication
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "user_metadata": { "name": "User Name" }
  },
  "userData": {
    "id": "uuid",
    "name": "User Name",
    "base_chronotype": "bear",
    "created_at": "2026-01-26T12:00:00Z"
  }
}
```

### Failed Authentication
```json
{
  "error": {
    "message": "Invalid login credentials",
    "status": 400
  }
}
```

---

## Error Handling

### AbortError (Development Only)
**Cause:** React Strict Mode + Supabase auth checks  
**Solution:** Suppressed via inline script in `public/index.html`

```javascript
if (error.name !== 'AbortError') {
  console.error('Auth error:', error);
}
```

### Network Errors
**Handling:** Show user-friendly message, allow retry

```javascript
catch (error) {
  if (error.message.includes('fetch')) {
    alert('בעיית רשת. נסה שוב.');
  }
}
```

---

## Security Considerations

1. **Never log passwords** → Only log sanitized error messages
2. **Use HTTPS in production** → Supabase enforces this
3. **Validate email format** → Client-side validation before API call
4. **Rate limiting** → Handled by Supabase (10 requests/sec per IP)
5. **Session storage** → Supabase uses httpOnly cookies (secure)

---

## Testing Checklist

- [ ] Sign up with new email
- [ ] Sign in with existing email
- [ ] Sign in with wrong password (should show error)
- [ ] Sign in with Google OAuth
- [ ] Sign in with GitHub OAuth
- [ ] Logout and verify session cleared
- [ ] Refresh page while logged in (session persists)
- [ ] Check profile data loads correctly
- [ ] Test with network offline (graceful degradation)

---

*Last Updated: 2026-01-26*

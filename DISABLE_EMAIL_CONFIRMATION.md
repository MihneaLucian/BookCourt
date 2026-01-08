# How to Disable Email Confirmation in Supabase

By default, Supabase requires users to confirm their email before they can sign in. To disable this requirement:

## Steps to Disable Email Confirmation

1. **Go to your Supabase Dashboard**
   - Navigate to [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Open Authentication Settings**
   - In the left sidebar, click on **Authentication**
   - Then click on **Settings** (or go directly to Authentication → Settings)

3. **Disable Email Confirmation**
   - Scroll down to the **Email Auth** section
   - Find the toggle for **"Enable email confirmations"**
   - **Turn it OFF** (disable it)

4. **Save Changes**
   - The changes are saved automatically

## What This Does

- Users can sign up and immediately sign in without confirming their email
- No confirmation emails will be sent
- Users are automatically authenticated after signup

## Alternative: Auto-Confirm Users (If you want to keep email confirmation but auto-confirm)

If you want to keep email confirmation enabled but automatically confirm users (for testing or specific use cases), you can:

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Manually confirm users, OR
3. Use the Supabase Admin API to auto-confirm users programmatically

## Important Notes

- **Security Consideration**: Disabling email confirmation means anyone with a valid email can create an account. Make sure this aligns with your security requirements.
- **For Production**: Consider keeping email confirmation enabled for production environments to prevent spam accounts.
- **For Development**: Disabling email confirmation is fine for development and testing.

## After Disabling

Once you disable email confirmation:
1. New users will be automatically signed in after signup
2. Existing unconfirmed users will need to be manually confirmed or you can delete and recreate their accounts
3. The signup flow in your app will work immediately without requiring email confirmation

## Testing

After disabling email confirmation:
1. Try creating a new account
2. You should be automatically signed in and redirected to the search page
3. No email confirmation step should be required

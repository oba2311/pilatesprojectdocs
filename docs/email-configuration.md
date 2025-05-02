# Email Configuration for Automated Arbox Sync

This document explains how to configure email sending for the Automated Arbox Sync feature. The system supports two methods for sending emails:

1. **Gmail API with OAuth 2.0** (recommended)
2. **SMTP with App Password** (fallback)

## Gmail API Method (Recommended)

The Gmail API method uses OAuth 2.0 authentication, which is more secure and reliable than password-based authentication. It avoids issues with Gmail's security policies that often block "less secure apps."

### Setup Instructions

1. **Create a Google Cloud Project**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Gmail API for your project

2. **Create OAuth 2.0 Credentials**:

   - In your Google Cloud project, go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" and select "OAuth client ID"
   - Select "Desktop app" as the application type
   - Name your OAuth client (e.g., "Pilates Studio Arbox Sync")
   - Click "Create"
   - Download the JSON file

3. **Save the Credentials File**:

   - Rename the downloaded JSON file to `client_secret.json`
   - Place it in the `scripts` directory of your project

4. **Run the Setup Process**:

   ```bash
   cd pilates-studio-app/scripts
   python gmail_api_sender.py --setup
   ```

   - This will open a browser window asking you to authorize the application
   - Sign in with the Gmail account you want to use for sending emails
   - Grant the requested permissions
   - The script will save the token for future use

5. **Test the Configuration**:
   ```bash
   python gmail_api_sender.py --test
   ```
   - This will send a test email to verify that everything is working correctly

### Environment Variables

For the Gmail API method, you only need to set these environment variables in your `.env` file:

```
EMAIL_SENDER=your-email@gmail.com
EMAIL_RECIPIENTS=recipient1@example.com, recipient2@example.com
```

### For GitHub Actions

For GitHub Actions, you need to add these secrets:

1. `GMAIL_CREDENTIALS`: The contents of your `client_secret.json` file
2. `GMAIL_TOKEN`: The contents of your `gmail_token.pickle` file (after running the setup process)
3. `EMAIL_SENDER`: Your Gmail address
4. `EMAIL_RECIPIENTS`: Comma-separated list of recipient email addresses

To get the contents of the `gmail_token.pickle` file in a format suitable for GitHub Secrets:

```bash
cat scripts/gmail_token.pickle | base64
```

Then add the base64-encoded string as the `GMAIL_TOKEN` secret.

## SMTP Method (Fallback)

The SMTP method uses an App Password for authentication. This is less secure than OAuth but serves as a fallback if the Gmail API method is not available.

### Setup Instructions

1. **Enable 2-Step Verification**:

   - Go to your [Google Account](https://myaccount.google.com/)
   - Select "Security" from the left sidebar
   - Under "Signing in to Google," select "2-Step Verification" and turn it on
   - Follow the prompts to set up 2-Step Verification

2. **Create an App Password**:

   - After enabling 2-Step Verification, go back to the Security page
   - Under "Signing in to Google," select "App passwords"
   - Select "Mail" as the app and "Other" as the device
   - Enter a name (e.g., "Pilates Studio App")
   - Click "Generate"
   - Google will display a 16-character password (no spaces)

3. **Update Your .env File**:
   ```
   EMAIL_SENDER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   EMAIL_RECIPIENTS=recipient1@example.com, recipient2@example.com
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   ```

### For GitHub Actions

For GitHub Actions, you need to add these secrets:

1. `EMAIL_SENDER`: Your Gmail address
2. `EMAIL_PASSWORD`: Your App Password
3. `EMAIL_RECIPIENTS`: Comma-separated list of recipient email addresses

## Troubleshooting

### Gmail API Issues

1. **Authorization Error**: If you see an authorization error, delete the `gmail_token.pickle` file and run the setup process again.

2. **Scope Changed**: If the API scope has changed, delete the `gmail_token.pickle` file and run the setup process again.

3. **Invalid Client**: Make sure your OAuth client is properly configured in the Google Cloud Console.

### SMTP Issues

1. **Authentication Failed**: Make sure you're using an App Password, not your regular Gmail password.

2. **Less Secure App Access**: This option is being phased out by Google. Use the App Password method instead.

3. **Special Characters in Password**: If your App Password contains special characters, make sure they're properly escaped in your `.env` file.

## Testing

To test your email configuration:

1. **Gmail API Only Test**:

   ```bash
   python gmail_api_sender.py --test
   ```

   This tests only the Gmail API email sending functionality.

2. **Full Process Test**:
   ```bash
   python automated_sync_arbox.py --run-once
   ```
   This runs the entire sync process once, including sending the email report, which is the most comprehensive test.

## Multiple Choice Questions

1. What is the recommended method for sending emails from the Automated Arbox Sync?

   - [ ] A. SMTP with regular password
   - [ ] B. SMTP with App Password
   - [ ] C. Gmail API with OAuth 2.0
   - [ ] D. SendGrid API

2. Why is the Gmail API method preferred over SMTP?

   - [ ] A. It's faster
   - [ ] B. It's more secure and reliable
   - [ ] C. It doesn't require a Gmail account
   - [ ] D. It works with any email provider

3. What do you need to create in Google Cloud Console for the Gmail API method?

   - [ ] A. A service account
   - [ ] B. An API key
   - [ ] C. OAuth 2.0 credentials
   - [ ] D. A Cloud Function

4. What is required before you can create an App Password for Gmail?

   - [ ] A. A Google Workspace account
   - [ ] B. 2-Step Verification enabled
   - [ ] C. A paid Gmail subscription
   - [ ] D. Admin privileges

5. What environment variables are required for the Gmail API method?
   - [ ] A. EMAIL_SENDER, EMAIL_PASSWORD, EMAIL_RECIPIENTS
   - [ ] B. EMAIL_SENDER, EMAIL_RECIPIENTS only
   - [ ] C. GMAIL_API_KEY, EMAIL_SENDER, EMAIL_RECIPIENTS
   - [ ] D. GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, EMAIL_SENDER

## Answers

1. C - Gmail API with OAuth 2.0 is the recommended method as it's more secure and reliable.

2. B - The Gmail API method is more secure and reliable because it uses OAuth 2.0 authentication instead of passwords.

3. C - You need to create OAuth 2.0 credentials in the Google Cloud Console for the Gmail API method.

4. B - 2-Step Verification must be enabled on your Google account before you can create an App Password.

5. B - For the Gmail API method, you only need EMAIL_SENDER and EMAIL_RECIPIENTS in your environment variables. The authentication is handled by the OAuth token.

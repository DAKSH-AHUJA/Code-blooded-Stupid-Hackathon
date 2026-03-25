# EmailJS Setup For ItExists

This dashboard now has an email capture section that sends a silly overthinking email through EmailJS.

## What the app expects

Edit [public/js/email-config.js](C:\ALL STUDY RELATED DOCS\PROJECTS\Acharya Hackathon (Stupid hackathon) (cursor)\public\js\email-config.js) and fill in:

```js
window.ITEXISTS_EMAILJS = {
  publicKey: "YOUR_PUBLIC_KEY",
  serviceId: "YOUR_SERVICE_ID",
  templateIds: [
    "YOUR_TEMPLATE_ID_ONE",
    "YOUR_TEMPLATE_ID_TWO"
  ]
};
```

The dashboard script will randomly choose one template ID from that array.

## Step by step

1. Create an EmailJS account at [EmailJS](https://www.emailjs.com/).
2. In EmailJS, add an email service.
   Use Gmail, Outlook, or any provider EmailJS supports in your account.
3. Copy your `Service ID`.
4. Go to the EmailJS email templates section and create two templates.
5. Copy both template IDs.
6. Go to Account or Integration settings and copy your `Public Key`.
7. Open [public/js/email-config.js](C:\ALL STUDY RELATED DOCS\PROJECTS\Acharya Hackathon (Stupid hackathon) (cursor)\public\js\email-config.js).
8. Paste your real `publicKey`, `serviceId`, and the two template IDs.
9. Save the file and reload the dashboard.
10. Enter an email in the dashboard section and test it.

## Template variables used by the app

Use these variable names inside your EmailJS templates:

- `{{to_email}}`
- `{{to_name}}`
- `{{user_name}}`
- `{{nickname}}`
- `{{doodle_name}}`
- `{{silly_opener}}`
- `{{overthink_line}}`
- `{{closing_line}}`
- `{{dashboard_url}}`

## Template 1 suggestion

Subject:

```text
ItExists has something unnecessary to say, {{to_name}}
```

Body:

```text
Hi {{to_name}},

{{silly_opener}}

Right now you are known here as {{nickname}}, which already feels like information you did not need in your real inbox.

Your chosen doodle: {{doodle_name}}.

{{overthink_line}}

{{closing_line}}

If you want to revisit the chaos:
{{dashboard_url}}
```

## Template 2 suggestion

Subject:

```text
A terrible update for {{nickname}}
```

Body:

```text
Hello {{to_name}},

This is your unnecessary reminder from ItExists.

{{silly_opener}}

You signed up under the name {{nickname}} and somehow made {{doodle_name}} part of the story too.

{{overthink_line}}

{{closing_line}}

Return to the dashboard if you insist:
{{dashboard_url}}
```

## Notes

- EmailJS sends from the browser here, so the public key and IDs live in frontend code.
- That is normal for EmailJS public/browser usage.
- If you want to store submitted emails in your own database too, I can add that next.

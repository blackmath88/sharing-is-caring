# Sending

The app never sends mail. It prepares one mail per person and hands it to your own mail client, so every send is a decision you make while looking at the draft.

There is no way to open a draft with attachments in every mail client without an OAuth integration such as the Microsoft Graph or Gmail API. The Export page therefore offers three paths and labels each honestly.

## What each path delivers

| Path | Recipient | Subject and text | Photos attached | HTML post card | Works in |
|---|---|---|---|---|---|
| **Senden** via share sheet | no, pick it in the client | yes | yes | no | iPhone, Android, Windows (Chrome, Edge), Safari on Mac |
| **Senden** via mailto | yes | yes | no | no | every client on every platform |
| **.eml** in classic Outlook for Windows | yes | yes | yes | yes | classic Outlook only |
| **.eml**, opened and forwarded | pick it in the client | yes | yes | yes | new Outlook, Outlook for Mac, Apple Mail, Thunderbird |
| **ZIP** | per folder | per folder | per folder | in the .eml | everywhere, as files |

In the share sheet and mailto paths the LinkedIn text is included as a link to the copy page, so the recipient still gets a one-click copy.

## Senden

The button checks whether the browser can share files. If it can, it resizes the person's photos, then opens the system share sheet with the photos and the text. You pick Outlook, Mail or any other app and get a draft with attachments. The recipient address is in the text's first line if the client does not carry it.

Browsers grant the share sheet only right after a click. If the photos take longer to prepare than that window allows, the button changes to "Jetzt senden"; the second click shares immediately from the prepared files.

Without file sharing, the button opens a `mailto:` draft with recipient, subject and the text. Photos are not possible in a mailto link; they sit in that person's folder inside the ZIP and are dragged into the draft.

## .eml

The .eml is the full mail: HTML body with the post card, inline previews and the full-size photos attached. Classic Outlook for Windows opens it as an unsent draft because of the `X-Unsent: 1` header. Every other client shows it as a received message. The two-step route there: open the file, choose **Forward**, pick the recipient, send. Body, card and attachments survive forwarding; the subject gains a "FW:" prefix you can delete.

If your browser is set to always open `.eml` files, the per-person button becomes a one-click path to the mail client.

## Size

Each mail carries the photos at the chosen export size. At 2000px a photo is roughly 0.75 MB, so a person with ten photos receives about 10 MB. Some mail servers reject messages above 20 MB; the Export page flags those rows. Choose a smaller export size on the Texte page if needed.

## What a real integration would add

A Microsoft Graph or Gmail integration could create the drafts directly in your mailbox with everything in place. It needs an OAuth app registration, user consent in the organisation and a sign-in step. It is not part of this project today and would remain optional if it were added: the three paths above need no account and no server.

# Update SSH Key in Yandex Cloud Config

## Your New SSH Public Key

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC3LY63PUg8wSdDBr+p19kNxdwWOnH0TJlcOaGxCeHTR singladno@gmail.com
```

## Correct Format for Yandex Cloud Interface

In the Yandex Cloud console cloud-config editor, use this **exact format**:

```yaml
#cloud-config
datasource:
  Ec2:
    strict_id: false
    ssh_pwauth: no
users:
  - name: ubuntu
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC3LY63PUg8wSdDBr+p19kNxdwWOnH0TJlcOaGxCeHTR singladno@gmail.com
```

## Important Notes

### ✅ Correct Format:
- `ssh_authorized_keys:` (with colon, no space before colon)
- `- ssh-ed25519 ...` (dash with space, then the full key on one line)
- The entire key must be on **one line** (no line breaks)

### ❌ Wrong Format (What you might see):
- `ubuntu:ssh-ed25519|` - This is incorrect
- Key split across multiple lines
- Missing dash before the key

## Steps to Update in Yandex Cloud Console

1. **Copy the entire key** (one line):
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC3LY63PUg8wSdDBr+p19kNxdwWOnH0TJlcOaGxCeHTR singladno@gmail.com
   ```

2. **In the cloud-config editor**:
   - Find the `ssh_authorized_keys:` section
   - Replace the old key with the new one
   - Make sure it's formatted as:
     ```yaml
     ssh_authorized_keys:
       - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC3LY63PUg8wSdDBr+p19kNxdwWOnH0TJlcOaGxCeHTR singladno@gmail.com
     ```

3. **Verify**:
   - No line breaks in the key
   - Starts with `ssh-ed25519`
   - Entire key is on one line after the dash

## Complete Cloud-Config Example

Here's the complete correct format:

```yaml
#cloud-config
datasource:
  Ec2:
    strict_id: false
    ssh_pwauth: no
users:
  - name: ubuntu
    sudo: ALL=(ALL) NOPASSWD:ALL
    shell: /bin/bash
    ssh_authorized_keys:
      - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC3LY63PUg8wSdDBr+p19kNxdwWOnH0TJlcOaGxCeHTR singladno@gmail.com
```

## What I Updated

✅ **Updated `cloud-init-config.yaml`** in your repository with the new key

This file will be used for future server deployments.

## Next Steps

1. **Update in Yandex Cloud Console**:
   - Use the format shown above
   - Replace the old key with the new one

2. **Add key to existing server**:
   - Follow `CHANGE_SSH_KEY_GUIDE.md` to add the key to your current server

3. **Test connection**:
   ```bash
   ssh -i ~/.ssh/id_ed25519_yandex_new ubuntu@130.193.56.134
   ```

## Troubleshooting

### If the key doesn't work in cloud-config:

1. **Check format**:
   - Must be YAML list format: `- ssh-ed25519 ...`
   - No line breaks in the key
   - Proper indentation (2 spaces)

2. **Verify key**:
   ```bash
   cat ~/.ssh/id_ed25519_yandex_new.pub
   ```
   Should show the full key on one line

3. **Test locally first**:
   - Add key to server manually
   - Test connection
   - Then update cloud-config

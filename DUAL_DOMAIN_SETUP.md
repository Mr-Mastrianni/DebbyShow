# Dual Domain Setup Guide

This guide explains how to configure both **debbyshow.com** and **debbieshow.com** to work with your website.

## Strategy

- **Primary Domain**: `debbyshow.com` (main website)
- **Secondary Domain**: `debbieshow.com` (redirects to primary)

This ensures visitors who misspell your name as "Debbie" will still reach your site.

## DNS Configuration

### For debbyshow.com (Primary Domain)

Configure these DNS records at your domain registrar:

```
Type    Name    Value                           TTL
A       @       185.199.108.153                 3600
A       @       185.199.109.153                 3600
A       @       185.199.110.153                 3600
A       @       185.199.111.153                 3600
CNAME   www     yourusername.github.io          3600
```

**Note**: Replace `yourusername.github.io` with your actual GitHub Pages URL.

### For debbieshow.com (Secondary Domain - Redirect)

You have two options:

#### Option 1: DNS-Level Redirect (Recommended)

Most domain registrars offer URL forwarding/redirect services. Configure:

```
Type: 301 Permanent Redirect
From: debbieshow.com
To: https://www.debbyshow.com
```

Also redirect www subdomain:
```
Type: 301 Permanent Redirect
From: www.debbieshow.com
To: https://www.debbyshow.com
```

**Popular registrars with this feature:**
- GoDaddy: Domain Forwarding
- Namecheap: URL Redirect
- Google Domains: Website Forwarding
- Cloudflare: Page Rules

#### Option 2: Point Both Domains to Same Server

If self-hosting with your Express server, configure the same A records for both domains:

**debbieshow.com DNS:**
```
Type    Name    Value                   TTL
A       @       YOUR_SERVER_IP          3600
A       www     YOUR_SERVER_IP          3600
```

The Express server middleware (already added) will handle the redirect automatically.

## GitHub Pages Configuration

If using GitHub Pages:

1. Go to your repository settings
2. Navigate to **Pages** section
3. Under **Custom domain**, enter: `www.debbyshow.com`
4. Enable **Enforce HTTPS**
5. GitHub will verify your DNS configuration

**Important**: GitHub Pages only supports one custom domain in the CNAME file. The secondary domain must redirect at the DNS level.

## SSL/HTTPS Certificates

### GitHub Pages
- Automatically provides SSL certificates for your custom domain
- Enable "Enforce HTTPS" in repository settings

### Self-Hosting
You'll need SSL certificates for both domains:

```bash
# Using Certbot (Let's Encrypt)
sudo certbot certonly --standalone -d debbyshow.com -d www.debbyshow.com -d debbieshow.com -d www.debbieshow.com
```

## Testing Your Setup

After DNS propagation (can take 24-48 hours), test all variations:

```bash
# Should all redirect to https://www.debbyshow.com
curl -I http://debbyshow.com
curl -I https://debbyshow.com
curl -I http://www.debbyshow.com
curl -I https://www.debbyshow.com

curl -I http://debbieshow.com
curl -I https://debbieshow.com
curl -I http://www.debbieshow.com
curl -I https://www.debbieshow.com
```

Look for `301 Moved Permanently` or `302 Found` status codes pointing to your primary domain.

## Server Configuration (Express)

The redirect middleware has been added to `server.js`:

```javascript
// Domain redirect middleware - redirect debbieshow.com to debbyshow.com
app.use((req, res, next) => {
    const host = req.get('host');
    
    if (host && (host.includes('debbieshow.com') || host.includes('www.debbieshow.com'))) {
        const protocol = req.protocol;
        const newHost = host.replace('debbieshow.com', 'debbyshow.com');
        return res.redirect(301, `${protocol}://${newHost}${req.originalUrl}`);
    }
    
    next();
});
```

This ensures server-side redirects work correctly if you're self-hosting.

## Troubleshooting

### DNS Not Propagating
- Use `nslookup debbyshow.com` or `dig debbyshow.com` to check DNS
- Try `https://dnschecker.org` to see global propagation status

### Redirect Not Working
- Verify DNS records are correct
- Check if your registrar's redirect feature is enabled
- Ensure no conflicting A/CNAME records exist

### SSL Certificate Errors
- Wait for DNS propagation before requesting certificates
- Ensure both domains point to the same server
- Check certificate includes all domain variations

## Summary

1. ✅ **CNAME file** set to `www.debbyshow.com`
2. ✅ **Express middleware** added for server-side redirects
3. 📋 **Configure DNS** at your domain registrar for both domains
4. 📋 **Set up redirects** from debbieshow.com → debbyshow.com
5. 📋 **Enable HTTPS** for both domains

Your visitors will reach your site whether they type "Debby" or "Debbie"!

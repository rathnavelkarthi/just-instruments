# Active Directory Integration Guide

## 🔐 **Active Directory Integration for JUST INSTRUMENTS**

### **Overview**
This guide explains how to integrate your JUST INSTRUMENTS platform with Active Directory for enterprise authentication.

## 🚀 **Quick Setup**

### **1. Open Database Manager**
```bash
# Open the database manager
start supabase-database-manager.html

# Or use batch file
open_database_manager.bat
```

### **2. Configure AD Settings**
1. **AD Server URL:** `ldap://your-domain.com:389`
2. **Base DN:** `DC=company,DC=com`
3. **Admin Username:** `admin@company.com`
4. **Admin Password:** Your AD admin password

### **3. Test Connection**
- Click "Test AD Connection" to verify settings
- Click "Configure AD Integration" to save settings

## 🔧 **Detailed Configuration**

### **AD Server Configuration**

#### **LDAP Server Settings:**
```
Server URL: ldap://your-domain.com:389
Secure LDAP: ldaps://your-domain.com:636
Port: 389 (standard) or 636 (secure)
```

#### **Base DN Examples:**
```
Single Domain: DC=company,DC=com
Subdomain: DC=subdomain,DC=company,DC=com
Multiple OUs: OU=Users,DC=company,DC=com
```

#### **Authentication Methods:**
1. **Simple Bind:** Username/password authentication
2. **SASL:** Advanced authentication mechanisms
3. **Kerberos:** Windows integrated authentication

## 🏗️ **Implementation Options**

### **Option 1: Client-Side Integration (Current)**
- **Pros:** Easy to implement, works immediately
- **Cons:** Limited security, credentials exposed
- **Use Case:** Development and testing

### **Option 2: Server-Side Integration (Recommended)**
- **Pros:** Secure, enterprise-grade
- **Cons:** Requires backend development
- **Use Case:** Production environments

### **Option 3: Supabase Edge Functions**
- **Pros:** Serverless, scalable
- **Cons:** Requires Supabase Pro plan
- **Use Case:** Cloud-based solutions

## 🔒 **Security Considerations**

### **Authentication Flow:**
1. **User enters AD credentials** in login form
2. **System validates** against AD server
3. **AD returns user attributes** (groups, roles, etc.)
4. **System maps AD groups** to platform roles
5. **User is authenticated** with appropriate permissions

### **Role Mapping:**
```
AD Group: "JUST_INSTRUMENTS_ADMINS" → Platform Role: "admin"
AD Group: "JUST_INSTRUMENTS_STAFF" → Platform Role: "staff"
AD Group: "JUST_INSTRUMENTS_CUSTOMERS" → Platform Role: "customer"
```

## 📋 **Implementation Steps**

### **Step 1: Configure AD Server**
1. **Enable LDAP** on your domain controller
2. **Create service account** for authentication
3. **Set up group structure** for role mapping
4. **Configure firewall rules** for LDAP access

### **Step 2: Update Login System**
1. **Modify login form** to accept AD credentials
2. **Add AD authentication** to login process
3. **Implement role mapping** from AD groups
4. **Update user session** management

### **Step 3: Test Integration**
1. **Test with AD users** from different groups
2. **Verify role mapping** works correctly
3. **Check permission levels** for each role
4. **Test logout and session** management

## 🛠️ **Code Implementation**

### **AD Authentication Function:**
```javascript
async function authenticateWithAD(username, password) {
    try {
        // AD server configuration
        const adConfig = JSON.parse(localStorage.getItem('adConfig'));
        
        // Create LDAP connection
        const ldap = require('ldapjs');
        const client = ldap.createClient({
            url: adConfig.serverUrl
        });
        
        // Bind to AD server
        await client.bind(adConfig.adminUser, adConfig.adminPass);
        
        // Search for user
        const searchOptions = {
            scope: 'sub',
            filter: `(sAMAccountName=${username})`,
            attributes: ['memberOf', 'displayName', 'mail']
        };
        
        // Get user attributes
        const userAttributes = await client.search(adConfig.baseDN, searchOptions);
        
        // Map AD groups to platform roles
        const userRole = mapADGroupsToRole(userAttributes.memberOf);
        
        return {
            success: true,
            user: {
                username: username,
                role: userRole,
                displayName: userAttributes.displayName,
                email: userAttributes.mail
            }
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
```

### **Role Mapping Function:**
```javascript
function mapADGroupsToRole(adGroups) {
    if (adGroups.includes('JUST_INSTRUMENTS_ADMINS')) {
        return 'admin';
    } else if (adGroups.includes('JUST_INSTRUMENTS_STAFF')) {
        return 'staff';
    } else if (adGroups.includes('JUST_INSTRUMENTS_CUSTOMERS')) {
        return 'customer';
    } else {
        return 'guest';
    }
}
```

## 🔄 **Database Operations**

### **Delete Database Entries:**
1. **Open Database Manager**
2. **Choose deletion type:**
   - Delete All Users
   - Delete All Customers
   - Delete All Certificates
   - Delete All Instruments
   - Delete All Data
3. **Confirm deletion** (permanent action)

### **Database Status:**
- **Real-time counts for each table**
- **Connection status monitoring**
- **Error handling and reporting**

## 🚨 **Important Warnings**

### **Delete Operations:**
- ⚠️ **Permanent deletion** - cannot be undone
- ⚠️ **Foreign key constraints** - delete in correct order
- ⚠️ **Backup recommended** before bulk deletions
- ⚠️ **Test environment** recommended for testing

### **AD Integration:**
- 🔒 **Secure credentials** - never expose in client code
- 🔒 **Network security** - use secure LDAP (LDAPS)
- 🔒 **Access control** - limit AD server access
- 🔒 **Audit logging** - track authentication attempts

## 📞 **Support and Troubleshooting**

### **Common Issues:**
1. **Connection refused** - Check AD server URL and port
2. **Authentication failed** - Verify credentials and permissions
3. **Group mapping errors** - Check AD group names and structure
4. **Network timeouts** - Check firewall and network connectivity

### **Testing Steps:**
1. **Test AD connection** with database manager
2. **Verify user authentication** with test accounts
3. **Check role mapping** for different user types
4. **Test session management** and logout

## 🎯 **Next Steps**

### **For Development:**
1. **Set up test AD environment**
2. **Configure basic authentication**
3. **Test with sample users**
4. **Implement role mapping**

### **For Production:**
1. **Set up secure AD server**
2. **Implement server-side authentication**
3. **Configure enterprise security**
4. **Set up monitoring and logging**

## 📚 **Additional Resources**

### **LDAP Documentation:**
- [Microsoft LDAP Guide](https://docs.microsoft.com/en-us/previous-versions/windows/desktop/ldap/ldap-start-page)
- [OpenLDAP Documentation](https://www.openldap.org/doc/)
- [LDAP Authentication Best Practices](https://ldap.com/ldap-authentication/)

### **Supabase Integration:**
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Custom Auth Providers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Edge Functions for Auth](https://supabase.com/docs/guides/functions)

Your Active Directory integration is now ready for configuration! 🚀

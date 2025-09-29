document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    // Authorized wallet addresses and account IDs
    const authorizedAccounts = {
        '0x0C8413cD91CA744b6e1C08980B3FdCd190EADF15': 'FG838318',
        '0xDdD089...Df71': 'FG327588',
        // Add more authorized accounts here
    };

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const walletAddress = document.getElementById('walletAddress').value.trim();
        const accountId = document.getElementById('accountId').value.trim();

        // Check if the wallet address and account ID combination is authorized
        if (authorizedAccounts[walletAddress] && authorizedAccounts[walletAddress] === accountId) {
            // Store login info for dashboard verification
            sessionStorage.setItem('isAuthorized', 'true');
            sessionStorage.setItem('walletAddress', walletAddress);
            sessionStorage.setItem('accountId', accountId);
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            // Show error message for unauthorized access
            alert('Invalid wallet address or account ID. Access denied.');
        }
    });
});

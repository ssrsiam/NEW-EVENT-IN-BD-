document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const partnerForm = document.getElementById('partnerForm');
    const verifyHashBtn = document.getElementById('verifyHashBtn');
    const verifyPromoBtn = document.getElementById('verifyPromoBtn');
    const promoStatus = document.getElementById('promoStatus');
    const partnerVerificationStatus = document.getElementById('partnerVerificationStatus');
    const depositAmountElement = document.getElementById('depositAmount');
    
    // Track promo code verification status
    let promoVerified = false;
    let hashVerified = false;
    let addressCopied = false;

    const BASE_DEPOSIT_AMOUNT = 17;
    const DISCOUNTED_AMOUNT = 15;

    if (depositAmountElement) {
        depositAmountElement.textContent = BASE_DEPOSIT_AMOUNT.toString();
    }

    // Authorized wallet addresses and account IDs
    const authorizedAccounts = {
        '0x0C8413cD91CA744b6e1C08980B3FdCd190EADF15': 'FG838318',
        '0xDdD089...Df71': 'FG327588',
        // Add more authorized accounts here
    };

    // Regular login functionality
    if (loginForm) {
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
    }

    // Partner program functionality
// Copy partner wallet address
    window.copyPartnerAddress = function() {
        const walletAddressElement = document.querySelector('.deposit-section .wallet-address');
        const walletAddress = walletAddressElement ? walletAddressElement.textContent : '';

        if (!walletAddress) {
            alert('Wallet address not found.');
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(walletAddress).then(() => {
                addressCopied = true;
                alert('Address copied successfully!');
            }).catch(err => {
                console.error('Failed to copy address:', err);
                alert('Failed to copy address. Please try again.');
            });
            return;
        }

        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = walletAddress;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                addressCopied = true;
                alert('Address copied successfully!');
            } else {
                throw new Error('Copy failed');
            }
        } catch (err) {
            console.error('Failed to copy address:', err);
            alert('Failed to copy address. Please try again.');
        } finally {
            document.body.removeChild(textarea);
        }
    };
    
    // Verify promo code functionality
    verifyPromoBtn.addEventListener('click', function() {
        const promoCode = document.getElementById('promoCode').value.trim();
        if (!promoCode) {
            promoStatus.textContent = 'Please enter a promo code';
            promoStatus.className = 'promo-status error';
            promoVerified = false;
            if (depositAmountElement) {
                depositAmountElement.textContent = BASE_DEPOSIT_AMOUNT.toString();
            }
            return;
        }

        // Check if promo code is valid (SSR)
        if (promoCode.toUpperCase() === 'SSR') {
            // Explicitly set the deposit amount to the discounted value
            if (depositAmountElement) {
                depositAmountElement.textContent = DISCOUNTED_AMOUNT.toString();
            }

            promoStatus.textContent = 'Promo code verified successfully! Deposit amount: $15 USD';
            promoStatus.className = 'promo-status success';
            verifyPromoBtn.disabled = true;
            verifyPromoBtn.innerHTML = '<i class="fas fa-check"></i> Verified';
            verifyPromoBtn.classList.add('verified');
            promoVerified = true;

            // Force update the display text with the discount
            const depositAmountContainer = document.querySelector('.deposit-amount p');
            if (depositAmountContainer) {
                depositAmountContainer.innerHTML = 'Deposit Amount: <span id="depositAmount">15</span> USD (USDT)';
            }
        } else {
            promoVerified = false;
            if (depositAmountElement) {
                depositAmountElement.textContent = BASE_DEPOSIT_AMOUNT.toString();
            }

            promoStatus.textContent = 'Invalid promo code. Please try again.';
            promoStatus.className = 'promo-status error';
        }
    });

    // Verify hash button functionality
    verifyHashBtn.addEventListener('click', function() {
        const transactionHash = document.getElementById('transactionHash').value.trim();
        
        if (!transactionHash) {
            alert('Please enter the transaction hash!');
            return;
        }
        
        // Simple verification - in a real app, this would validate against a server
        if (transactionHash.length > 10) {
            alert('Transaction hash verified successfully!');
            
            // Disable the verify button after successful verification
            verifyHashBtn.disabled = true;
            verifyHashBtn.innerHTML = '<i class="fas fa-check"></i> Verified';
            verifyHashBtn.classList.add('verified');
            hashVerified = true;
            partnerVerificationStatus.textContent = '';
            partnerVerificationStatus.className = 'verification-status';
        } else {
            alert('Invalid transaction hash. Please check and try again.');
            hashVerified = false;
        }
    });

    // Partner form submission
    if (partnerForm) {
        partnerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const partnerAddress = document.getElementById('partnerAddress').value.trim();
            const partnerSelect = document.getElementById('partnerSelect').value;
            const transactionHash = document.getElementById('transactionHash').value.trim();

            // Validate all fields
            if (!partnerAddress || !partnerSelect || !transactionHash) {
                alert('Please fill in all fields!');
                return;
            }

            if (!addressCopied) {
                partnerVerificationStatus.textContent = 'Please copy the deposit address and complete the deposit first. Verification failed.';
                partnerVerificationStatus.className = 'verification-status error';
                alert('Please copy the deposit address.');
                return;
            }

            // Check if promo code is verified - REQUIRED
            if (!promoVerified) {
                partnerVerificationStatus.textContent = 'You must use the promo code to join the partner program. Verification failed.';
                partnerVerificationStatus.className = 'verification-status error';
                alert('Please verify your promo code. Use the SSR code.');
                document.getElementById('promoCode').focus();
                document.getElementById('promoStatus').textContent = 'Promo code verification is required!';
                document.getElementById('promoStatus').className = 'promo-status error';
                return;
            }

            // Check if hash is verified
            if (!hashVerified) {
                partnerVerificationStatus.textContent = 'Partner program enrollment failed because the transaction hash is not verified.';
                partnerVerificationStatus.className = 'verification-status error';
                alert('Please verify your transaction hash.');
                return;
            }

            // Show success message
            partnerVerificationStatus.textContent = 'You have successfully joined the partner program. Your leader will provide further updates.';
            partnerVerificationStatus.className = 'verification-status success';

            // Disable form fields after successful verification
            const formElements = partnerForm.elements;
            for (let i = 0; i < formElements.length; i++) {
                formElements[i].disabled = true;
            }
        });
    }
});

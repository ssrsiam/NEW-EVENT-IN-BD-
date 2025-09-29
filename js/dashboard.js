document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authorized to access dashboard
    const isAuthorized = sessionStorage.getItem('isAuthorized');
    if (!isAuthorized) {
        alert('Unauthorized access. Please login first.');
        window.location.href = 'login.html';
        return;
    }

    // Two-step verification tracking
    let accountVerified = sessionStorage.getItem('accountVerified') === 'true';
    let paymentVerified = sessionStorage.getItem('paymentVerified') === 'true';
    let isDualMode = true; // Default to dual verification mode
    
    const verificationForm = document.getElementById('verificationForm');
    const verificationStatus = document.getElementById('verificationStatus');
    const dashboardContent = document.querySelector('.dashboard-content');

    // Block dashboard content if either verification is missing
    if (!accountVerified || !paymentVerified) {
        blockDashboardAccess();
    }

    verificationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (isDualMode) {
            // Dual verification mode - both hashes at once
            const accountHash = document.getElementById('accountHash')?.value.trim() || '';
            const paymentHash = document.getElementById('paymentHash')?.value.trim() || '';

            // SSR validation - if no SSR provided
            if (accountHash === '' || paymentHash === '') {
                verificationStatus.textContent = 'Verification Failed (No SSR)';
                verificationStatus.className = 'verification-status error';
                return;
            }

            // SSR validation - if SSR input provided
            verificationStatus.textContent = 'Verification Successful';
            verificationStatus.className = 'verification-status success';
            
            // Mark both as verified
            sessionStorage.setItem('accountVerified', 'true');
            sessionStorage.setItem('paymentVerified', 'true');
            accountVerified = true;
            paymentVerified = true;
            
            // Update status badge
            const statusBadge = document.querySelector('.verification-section .status-badge');
            statusBadge.textContent = 'Completed';
            statusBadge.className = 'status-badge success';
            
            // Unlock dashboard
            setTimeout(() => {
                unlockDashboardAccess();
            }, 2000);
            
        } else {
            // Single step mode - original step-by-step verification
            const transactionHash = document.getElementById('transactionHash').value.trim();

            // SSR validation - if no SSR provided
            if (transactionHash === '') {
                verificationStatus.textContent = 'Verification Failed (No SSR)';
                verificationStatus.className = 'verification-status error';
                return;
            }

            // Step 1: Account Verification
            if (!accountVerified) {
                verificationStatus.textContent = 'Verification Successful';
                verificationStatus.className = 'verification-status success';
                
                sessionStorage.setItem('accountVerified', 'true');
                accountVerified = true;
                
                setTimeout(() => {
                    updateVerificationStep();
                    verificationStatus.textContent = 'Account verified! Now submit your payment transaction hash';
                    verificationStatus.className = 'verification-status info';
                }, 1500);
                return;
            }

            // Step 2: Payment Hash Verification
            if (accountVerified && !paymentVerified) {
                verificationStatus.textContent = 'Verification Successful';
                verificationStatus.className = 'verification-status success';
                
                sessionStorage.setItem('paymentVerified', 'true');
                paymentVerified = true;
                
                setTimeout(() => {
                    unlockDashboardAccess();
                }, 1500);
            }
        }
    });

    function updateVerificationStep() {
        const cardHeader = document.querySelector('.verification-section .card-header h2');
        const statusBadge = document.querySelector('.verification-section .status-badge');
        const instructions = document.querySelector('.instructions');
        const inputLabel = document.querySelector('label[for="transactionHash"]');
        const inputField = document.getElementById('transactionHash');
        const submitButton = document.querySelector('.verify-btn');
        
        // Update header and badge
        cardHeader.innerHTML = '<i class="fas fa-shield-alt"></i> Payment Hash Verification';
        statusBadge.textContent = 'Step 2/2';
        statusBadge.className = 'status-badge progress';
        
        // Update instructions
        instructions.innerHTML = `
            <div class="payment-info">
                <h3>Step 2: Payment Hash Verification</h3>
                <p><strong>Account verified!</strong> Now submit your payment transaction hash:</p>
                <div class="address-container">
                    <code class="wallet-address">0x3bc81fB3ffc5B81a66422c1a9c67875bD7CF7724</code>
                    <button class="copy-btn" onclick="copyAddress()">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <p class="note">⚠️ Use USDT (TRC20) network for faster processing</p>
            </div>
        `;
        
        // Update form elements
        inputLabel.textContent = 'Payment Transaction Hash';
        inputField.placeholder = 'Enter your payment transaction hash';
        inputField.value = '';
        submitButton.innerHTML = '<i class="fas fa-check-circle"></i> Complete Verification';
        
        // Update overlay
        updateOverlay();
    }

    function updateOverlay() {
        const overlay = document.querySelector('.payment-overlay');
        if (overlay) {
            const overlayContent = overlay.querySelector('.overlay-content');
            overlayContent.innerHTML = `
                <i class="fas fa-shield-alt"></i>
                <h3>Verification Required</h3>
                <p>Complete both account verification and payment hash verification to access dashboard features</p>
                <div class="verification-steps">
                    <div class="step completed">
                        <i class="fas fa-check-circle"></i>
                        <span>Account Verification - COMPLETED</span>
                    </div>
                    <div class="step pending">
                        <i class="fas fa-clock"></i>
                        <span>Payment Hash Verification - PENDING</span>
                    </div>
                </div>
            `;
        }
    }

    function blockDashboardAccess() {
        const sections = dashboardContent.querySelectorAll('.card:not(.verification-section)');
        sections.forEach(section => {
            section.style.opacity = '0.3';
            section.style.pointerEvents = 'none';
            section.style.filter = 'blur(2px)';
        });
        
        // Add overlay message
        if (!document.querySelector('.payment-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'payment-overlay';
            overlay.innerHTML = `
                <div class="overlay-content">
                    <i class="fas fa-shield-alt"></i>
                    <h3>Verification Required</h3>
                    <p>Complete both account verification and payment hash verification to access dashboard features</p>
                    <div class="verification-steps">
                        <div class="step ${accountVerified ? 'completed' : 'pending'}">
                            <i class="fas fa-${accountVerified ? 'check-circle' : 'clock'}"></i>
                            <span>Account Verification ${accountVerified ? '- COMPLETED' : '- PENDING'}</span>
                        </div>
                        <div class="step ${paymentVerified ? 'completed' : 'pending'}">
                            <i class="fas fa-${paymentVerified ? 'check-circle' : 'clock'}"></i>
                            <span>Payment Hash Verification ${paymentVerified ? '- COMPLETED' : '- PENDING'}</span>
                        </div>
                    </div>
                    <div class="overlay-actions">
                        <button class="goto-verification-btn" onclick="goToVerificationSection()">
                            <i class="fas fa-arrow-down"></i>
                            Go to Verification Section
                        </button>
                        <button class="close-overlay-btn" onclick="closeVerificationOverlay()">
                            <i class="fas fa-times"></i>
                            Close
                        </button>
                    </div>
                </div>
            `;
            dashboardContent.appendChild(overlay);
        }
    }

    function unlockDashboardAccess() {
        const sections = dashboardContent.querySelectorAll('.card:not(.verification-section)');
        sections.forEach(section => {
            section.style.opacity = '1';
            section.style.pointerEvents = 'auto';
            section.style.filter = 'none';
        });
        
        // Remove overlay
        const overlay = document.querySelector('.payment-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
});

// Copy wallet address function
function copyAddress() {
    const address = '0x3bc81fB3ffc5B81a66422c1a9c67875bD7CF7724';
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(address).then(function() {
            showCopyFeedback();
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyFeedback();
    }
}

function showCopyFeedback() {
    const copyBtn = document.querySelector('.copy-btn');
    const originalHTML = copyBtn.innerHTML;
    
    copyBtn.innerHTML = '<i class="fas fa-check"></i>';
    copyBtn.style.background = '#28a745';
    
    setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
        copyBtn.style.background = '';
    }, 2000);
}

// Toggle between dual and single verification modes
function toggleVerificationMode() {
    const isDualModeActive = document.querySelector('.dual-verification-inputs');
    const cardHeader = document.querySelector('.verification-section .card-header h2');
    const statusBadge = document.querySelector('.verification-section .status-badge');
    const instructions = document.querySelector('.instructions');
    const form = document.querySelector('#verificationForm');
    
    if (isDualModeActive) {
        // Switch to single mode
        cardHeader.innerHTML = '<i class="fas fa-shield-alt"></i> Step-by-Step Verification';
        statusBadge.textContent = 'Step 1/2';
        statusBadge.className = 'status-badge pending';
        
        instructions.innerHTML = `
            <div class="payment-info">
                <h3>Step 1: Account Verification</h3>
                <p>Send exactly <strong>$17 USD</strong> to the address below:</p>
                <div class="address-container">
                    <code class="wallet-address">0x3bc81fB3ffc5B81a66422c1a9c67875bD7CF7724</code>
                    <button class="copy-btn" onclick="copyAddress()">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <p class="note">⚠️ Use USDT (TRC20) network for faster processing</p>
            </div>
        `;
        
        form.innerHTML = `
            <div class="input-group">
                <label for="transactionHash">Transaction Hash</label>
                <div class="input-with-icon">
                    <i class="fas fa-link"></i>
                    <input type="text" id="transactionHash" placeholder="Enter your transaction hash" required>
                </div>
            </div>
            <div class="verification-options">
                <button type="button" class="verify-btn dual-mode" onclick="toggleVerificationMode()">
                    <i class="fas fa-fast-forward"></i>
                    Switch to Dual Mode
                </button>
                <button type="submit" class="verify-btn single-mode">
                    <i class="fas fa-check-circle"></i>
                    Verify Account
                </button>
            </div>
        `;
        
    } else {
        // Switch to dual mode
        cardHeader.innerHTML = '<i class="fas fa-shield-alt"></i> Account & Payment Verification';
        statusBadge.textContent = 'Dual Verification';
        statusBadge.className = 'status-badge pending';
        
        instructions.innerHTML = `
            <div class="payment-info">
                <h3>Complete Both Verifications Simultaneously</h3>
                <p>Send exactly <strong>$17 USD</strong> to the address below:</p>
                <div class="address-container">
                    <code class="wallet-address">0x3bc81fB3ffc5B81a66422c1a9c67875bD7CF7724</code>
                    <button class="copy-btn" onclick="copyAddress()">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <p class="note">⚠️ Use USDT (TRC20) network for faster processing</p>
                <div class="verification-info">
                    <i class="fas fa-info-circle"></i>
                    <span>Submit both transaction hashes below to complete verification in one step</span>
                </div>
            </div>
        `;
        
        form.innerHTML = `
            <div class="dual-verification-inputs">
                <div class="input-group">
                    <label for="accountHash">Account Verification Hash</label>
                    <div class="input-with-icon">
                        <i class="fas fa-user-check"></i>
                        <input type="text" id="accountHash" placeholder="Enter account transaction hash" required>
                    </div>
                </div>
                <div class="input-group">
                    <label for="paymentHash">Payment Verification Hash</label>
                    <div class="input-with-icon">
                        <i class="fas fa-credit-card"></i>
                        <input type="text" id="paymentHash" placeholder="Enter payment transaction hash" required>
                    </div>
                </div>
            </div>
            <div class="verification-options">
                <button type="button" class="verify-btn single-mode" onclick="toggleVerificationMode()">
                    <i class="fas fa-step-forward"></i>
                    Switch to Step-by-Step Mode
                </button>
                <button type="submit" class="verify-btn dual-mode">
                    <i class="fas fa-check-double"></i>
                    Complete Dual Verification
                </button>
            </div>
        `;
    }
    
    // Clear any previous status messages
    const verificationStatus = document.getElementById('verificationStatus');
    verificationStatus.textContent = '';
    verificationStatus.className = '';
}

// Navigate to verification section
function goToVerificationSection() {
    const verificationSection = document.querySelector('.verification-section');
    const overlay = document.querySelector('.payment-overlay');
    
    // Hide overlay temporarily
    if (overlay) {
        overlay.style.opacity = '0.3';
        overlay.style.pointerEvents = 'none';
    }
    
    // Scroll to verification section
    verificationSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
    
    // Highlight verification section
    verificationSection.style.border = '3px solid var(--color-gold)';
    verificationSection.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.5)';
    verificationSection.style.transform = 'scale(1.02)';
    verificationSection.style.transition = 'all 0.3s ease';
    
    // Focus on first input field
    setTimeout(() => {
        const firstInput = verificationSection.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }, 500);
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
        verificationSection.style.border = '';
        verificationSection.style.boxShadow = '';
        verificationSection.style.transform = '';
        
        // Show overlay again with reduced opacity
        if (overlay) {
            overlay.style.opacity = '0.1';
            overlay.style.pointerEvents = 'auto';
        }
    }, 3000);
}

// Close verification overlay
function closeVerificationOverlay() {
    const overlay = document.querySelector('.payment-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        
        // Show notification about verification requirement
        showVerificationReminder();
    }
}

// Show verification reminder notification
function showVerificationReminder() {
    const notification = document.createElement('div');
    notification.className = 'verification-reminder';
    notification.innerHTML = `
        <div class="reminder-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Complete verification to access all dashboard features</span>
            <button onclick="goToVerificationSection()" class="reminder-btn">
                <i class="fas fa-arrow-right"></i>
                Verify Now
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

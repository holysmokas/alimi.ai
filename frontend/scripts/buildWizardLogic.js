import { db } from '/frontend/scripts/config.js';
import { ENDPOINTS } from './config.js';

// ============================================
// SECURITY: Input Sanitization Functions
// ============================================

const SecurityUtils = {
    sanitizeText: (input) => {
        if (!input || typeof input !== 'string') return '';
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/data:/gi, '')
            .trim()
            .slice(0, 1000);
    },

    sanitizeName: (input) => {
        if (!input || typeof input !== 'string') return '';
        return input
            .replace(/[<>\"\'`;\\]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim()
            .slice(0, 200);
    },

    sanitizeEmail: (input) => {
        if (!input || typeof input !== 'string') return '';
        return input
            .toLowerCase()
            .replace(/[<>\"\'`;\\]/g, '')
            .trim()
            .slice(0, 254);
    },

    sanitizePhone: (input) => {
        if (!input || typeof input !== 'string') return '';
        return input
            .replace(/[^0-9\s\-\(\)\+]/g, '')
            .trim()
            .slice(0, 30);
    },

    sanitizeUrl: (input) => {
        if (!input || typeof input !== 'string') return '';
        const trimmed = input.trim();
        if (trimmed.match(/^(javascript|data|vbscript):/i)) {
            return '';
        }
        return trimmed.slice(0, 2000);
    },

    sanitizeDomain: (input) => {
        if (!input || typeof input !== 'string') return '';
        let cleaned = input.toLowerCase().trim();
        cleaned = cleaned.replace(/^https?:\/\//, '');
        cleaned = cleaned.replace(/^www\./, '');
        cleaned = cleaned.split('/')[0];
        cleaned = cleaned.replace(/[^a-z0-9\.\-]/g, '');
        return cleaned.slice(0, 253);
    },

    sanitizeLongText: (input) => {
        if (!input || typeof input !== 'string') return '';
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .replace(/data:text\/html/gi, '')
            .trim()
            .slice(0, 10000);
    },

    sanitizeAddress: (input) => {
        if (!input || typeof input !== 'string') return '';
        return input
            .replace(/[<>\"\'`;\\]/g, '')
            .replace(/javascript:/gi, '')
            .trim()
            .slice(0, 500);
    },

    detectAttack: (input) => {
        if (!input || typeof input !== 'string') return false;
        const attackPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /union\s+select/i,
            /;\s*drop\s+table/i,
            /;\s*delete\s+from/i,
            /'\s*or\s+'1'\s*=\s*'1/i,
            /--\s*$/,
            /\/\*.*\*\//,
            /\$\{.*\}/,
            /\{\{.*\}\}/,
            /<iframe/i,
            /<embed/i,
            /<object/i,
            /expression\s*\(/i,
        ];
        return attackPatterns.some(pattern => pattern.test(input));
    }
};

// ============================================
// SECURITY: Rate Limiting
// ============================================

const FormRateLimiter = {
    submissions: {},
    maxSubmissions: 3,
    windowTime: 60 * 1000,
    cooldownTime: 5 * 60 * 1000,

    canSubmit: (identifier = 'build_wizard') => {
        const now = Date.now();
        const record = FormRateLimiter.submissions[identifier];
        if (!record) return true;
        if (record.cooldownUntil && now < record.cooldownUntil) return false;
        if (now - record.windowStart > FormRateLimiter.windowTime) {
            delete FormRateLimiter.submissions[identifier];
            return true;
        }
        return record.count < FormRateLimiter.maxSubmissions;
    },

    recordSubmission: (identifier = 'build_wizard') => {
        const now = Date.now();
        if (!FormRateLimiter.submissions[identifier]) {
            FormRateLimiter.submissions[identifier] = { count: 0, windowStart: now };
        }
        const record = FormRateLimiter.submissions[identifier];
        if (now - record.windowStart > FormRateLimiter.windowTime) {
            record.count = 0;
            record.windowStart = now;
        }
        record.count++;
        if (record.count >= FormRateLimiter.maxSubmissions) {
            record.cooldownUntil = now + FormRateLimiter.cooldownTime;
        }
    },

    getRemainingCooldown: (identifier = 'build_wizard') => {
        const record = FormRateLimiter.submissions[identifier];
        if (!record?.cooldownUntil) return 0;
        const remaining = record.cooldownUntil - Date.now();
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }
};

const DomainCheckLimiter = {
    checks: {},
    maxChecks: 10,
    windowTime: 60 * 1000,

    canCheck: () => {
        const now = Date.now();
        const record = DomainCheckLimiter.checks['domain'];
        if (!record) return true;
        if (now - record.windowStart > DomainCheckLimiter.windowTime) {
            delete DomainCheckLimiter.checks['domain'];
            return true;
        }
        return record.count < DomainCheckLimiter.maxChecks;
    },

    recordCheck: () => {
        const now = Date.now();
        if (!DomainCheckLimiter.checks['domain']) {
            DomainCheckLimiter.checks['domain'] = { count: 0, windowStart: now };
        }
        const record = DomainCheckLimiter.checks['domain'];
        if (now - record.windowStart > DomainCheckLimiter.windowTime) {
            record.count = 0;
            record.windowStart = now;
        }
        record.count++;
    }
};

// ============================================
// WIZARD STATE (Global)
// ============================================

window.wizardData = {
    currentStep: 1,
    totalSteps: 8,  // Updated from 7 to 8

    // Step 1: Package
    package: null,
    packagePrice: 0,

    // Step 2: Domain
    domainOption: null,
    domain: null,
    domainPrice: 0,
    domainPricing: null,

    // Step 3: About You
    businessName: '',
    whatYouDo: '',
    targetAudience: '',
    tagline: '',

    // Step 4: Business Contact Info (NEW)
    businessEmail: '',
    showBusinessEmail: true,
    businessPhone: '',
    showBusinessPhone: true,
    businessAddress: '',
    showBusinessAddress: false,
    businessHours: '',
    showBusinessHours: false,
    socialFacebook: '',
    socialInstagram: '',
    socialLinkedin: '',
    socialTwitter: '',

    // Step 5: Website Goals (was Step 4)
    primaryAction: null,
    features: [],

    // Step 6: Design (was Step 5)
    designStyle: null,
    brandColor: '#10b981',
    inspirationUrl: '',

    // Step 7: Content (was Step 6)
    contentReady: 'yes',
    logoFile: null,
    additionalNotes: '',

    // Step 8: Contact & Review (was Step 7)
    fullName: '',
    email: '',
    phone: '',
    contactMethod: 'email'
};

// Package configuration
const packagePrices = {
    starter: 0.50,
    business: 0.50,
    shop: 0.50
};

const packageNames = {
    starter: 'Starter',
    business: 'Business',
    shop: 'Small Shop'
};

// Style names for display
const styleNames = {
    modern: 'Modern & Minimal',
    bold: 'Bold & Colorful',
    classic: 'Classic & Professional',
    playful: 'Playful & Fun'
};

// Primary action names for display
const actionNames = {
    contact: 'Contact Me / Get Inquiries',
    book: 'Book Appointments',
    buy: 'Sell Products',
    hire: 'Get Hired / Showcase Work',
    subscribe: 'Build Email List',
    learn: 'Educate & Inform'
};

// Step names for progress indicator (Updated for 8 steps)
const stepNames = [
    'Choose Package',
    'Your Domain',
    'About You',
    'Contact Info',      // NEW Step 4
    'Website Goals',     // Was Step 4
    'Design Style',      // Was Step 5
    'Your Content',      // Was Step 6
    'Review & Pay'       // Was Step 7
];

// ============================================
// NAVIGATION
// ============================================

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });

    // Show target step
    const targetStep = document.getElementById(`step${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // Update progress
    const progress = (step / wizardData.totalSteps) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
    document.getElementById('stepIndicator').textContent = `Step ${step} of ${wizardData.totalSteps}`;
    document.getElementById('stepName').textContent = stepNames[step - 1] || '';

    // Populate review if on last step (now step 8)
    if (step === 8) {
        populateReview();
    }

    // Scroll to top
    document.querySelector('.wizard-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.nextStep = function () {
    if (wizardData.currentStep < wizardData.totalSteps) {
        wizardData.currentStep++;
        showStep(wizardData.currentStep);
    }
};

window.prevStep = function () {
    if (wizardData.currentStep > 1) {
        wizardData.currentStep--;
        showStep(wizardData.currentStep);
    }
};

// ============================================
// STEP 1: PACKAGE SELECTION
// ============================================

window.selectPackage = function (pkg) {
    wizardData.package = pkg;
    wizardData.packagePrice = packagePrices[pkg];

    // Update UI
    document.querySelectorAll('.package-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-package="${pkg}"]`)?.classList.add('selected');

    // Enable continue button
    document.getElementById('step1Next').disabled = false;
};

// ============================================
// STEP 2: DOMAIN SELECTION
// ============================================

window.selectDomainOption = function (option) {
    wizardData.domainOption = option;

    // Update UI
    document.querySelectorAll('.domain-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    document.querySelector(`[data-option="${option}"]`)?.classList.add('selected');

    // Show/hide appropriate input
    document.getElementById('newDomainSearch').style.display = option === 'new' ? 'block' : 'none';
    document.getElementById('ownDomainInput').style.display = option === 'own' ? 'block' : 'none';

    // Reset domain data
    wizardData.domain = null;
    wizardData.domainPrice = 0;
    document.getElementById('step2Next').disabled = true;
    document.getElementById('domainResult').classList.remove('visible');
};

window.checkDomainAvailability = async function () {
    if (!DomainCheckLimiter.canCheck()) {
        alert('Too many domain checks. Please wait a moment.');
        return;
    }

    const domainInput = document.getElementById('domainSearchInput');
    const domain = SecurityUtils.sanitizeDomain(domainInput.value);

    if (!domain || domain.length < 3) {
        alert('Please enter a valid domain name');
        return;
    }

    const btn = document.getElementById('checkDomainBtn');
    const resultDiv = document.getElementById('domainResult');

    btn.disabled = true;
    btn.textContent = 'Checking...';

    DomainCheckLimiter.recordCheck();

    try {
        const response = await fetch(ENDPOINTS.checkDomain, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain })
        });

        const data = await response.json();

        resultDiv.classList.add('visible');

        if (data.available) {
            // Get price from pricing object (API returns pricing.initialCost, not price)
            const domainPrice = data.pricing?.initialCost || 12.99;

            document.getElementById('domainResultIcon').textContent = '✓';
            document.getElementById('domainResultIcon').className = 'domain-result-icon success';
            document.getElementById('domainResultTitle').textContent = 'Domain available!';
            document.getElementById('domainResultDesc').textContent = `${domain} - $${domainPrice.toFixed(2)}/year`;

            wizardData.domain = domain;
            wizardData.domainPrice = domainPrice;
            wizardData.domainPricing = data.pricing || null;
            document.getElementById('step2Next').disabled = false;
        } else {
            document.getElementById('domainResultIcon').textContent = '✗';
            document.getElementById('domainResultIcon').className = 'domain-result-icon error';
            document.getElementById('domainResultTitle').textContent = 'Domain not available';
            document.getElementById('domainResultDesc').textContent = data.message || 'Try a different name';
            document.getElementById('step2Next').disabled = true;
        }
    } catch (error) {
        console.error('Domain check error:', error);
        resultDiv.classList.add('visible');
        document.getElementById('domainResultIcon').textContent = '!';
        document.getElementById('domainResultIcon').className = 'domain-result-icon error';
        document.getElementById('domainResultTitle').textContent = 'Error checking domain';
        document.getElementById('domainResultDesc').textContent = 'Please try again';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Check';
    }
};

window.validateExistingDomain = function () {
    const input = document.getElementById('existingDomainInput');
    const domain = SecurityUtils.sanitizeDomain(input.value);

    if (domain && domain.includes('.') && domain.length >= 4) {
        wizardData.domain = domain;
        wizardData.domainPrice = 0;
        document.getElementById('step2Next').disabled = false;
    } else {
        document.getElementById('step2Next').disabled = true;
    }
};

// ============================================
// STEP 3: ABOUT YOU
// ============================================

window.validateStep3 = function () {
    const businessName = document.getElementById('businessName').value.trim();
    const whatYouDo = document.getElementById('whatYouDo').value.trim();
    const targetAudience = document.getElementById('targetAudience').value.trim();

    wizardData.businessName = SecurityUtils.sanitizeName(businessName);
    wizardData.whatYouDo = SecurityUtils.sanitizeLongText(whatYouDo);
    wizardData.targetAudience = SecurityUtils.sanitizeLongText(targetAudience);
    wizardData.tagline = SecurityUtils.sanitizeText(document.getElementById('tagline').value);

    const isValid = businessName.length >= 2 && whatYouDo.length >= 10 && targetAudience.length >= 5;
    document.getElementById('step3Next').disabled = !isValid;
};

// ============================================
// STEP 4: BUSINESS CONTACT INFO (NEW)
// ============================================

window.validateStep4 = function () {
    const businessEmail = document.getElementById('businessEmail').value.trim();
    const businessPhone = document.getElementById('businessPhone')?.value.trim() || '';
    const businessAddress = document.getElementById('businessAddress')?.value.trim() || '';
    const businessHours = document.getElementById('businessHours')?.value.trim() || '';

    // Sanitize and store values
    wizardData.businessEmail = SecurityUtils.sanitizeEmail(businessEmail);
    wizardData.businessPhone = SecurityUtils.sanitizePhone(businessPhone);
    wizardData.businessAddress = SecurityUtils.sanitizeAddress(businessAddress);
    wizardData.businessHours = SecurityUtils.sanitizeText(businessHours);

    // Store display preferences
    wizardData.showBusinessEmail = document.getElementById('showBusinessEmail')?.checked ?? true;
    wizardData.showBusinessPhone = document.getElementById('showBusinessPhone')?.checked ?? true;
    wizardData.showBusinessAddress = document.getElementById('showBusinessAddress')?.checked ?? false;
    wizardData.showBusinessHours = document.getElementById('showBusinessHours')?.checked ?? false;

    // Store social media links
    wizardData.socialFacebook = SecurityUtils.sanitizeUrl(document.getElementById('socialFacebook')?.value || '');
    wizardData.socialInstagram = SecurityUtils.sanitizeUrl(document.getElementById('socialInstagram')?.value || '');
    wizardData.socialLinkedin = SecurityUtils.sanitizeUrl(document.getElementById('socialLinkedin')?.value || '');
    wizardData.socialTwitter = SecurityUtils.sanitizeUrl(document.getElementById('socialTwitter')?.value || '');

    // Validate - only business email is required
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(businessEmail);

    document.getElementById('step4Next').disabled = !isValid;
};

// ============================================
// STEP 5: WEBSITE GOALS (was Step 4)
// ============================================

window.selectPrimaryAction = function (action) {
    wizardData.primaryAction = action;

    // Update UI
    document.querySelectorAll('.action-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-action="${action}"]`)?.classList.add('selected');

    // Enable continue button
    document.getElementById('step5Next').disabled = false;
};

window.toggleCheckbox = function (element) {
    element.classList.toggle('checked');

    // Gather all checked features
    const checked = document.querySelectorAll('#featuresGrid .checkbox-item.checked');
    wizardData.features = Array.from(checked).map(el => el.dataset.value);
};

// ============================================
// STEP 6: DESIGN STYLE (was Step 5)
// ============================================

window.selectStyle = function (style) {
    wizardData.designStyle = style;

    // Update UI
    document.querySelectorAll('.style-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-style="${style}"]`)?.classList.add('selected');

    // Enable continue button
    document.getElementById('step6Next').disabled = false;
};

// ============================================
// STEP 7: YOUR CONTENT (was Step 6)
// ============================================

window.handleLogoUpload = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Maximum size is 5MB.');
        return;
    }

    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }

    wizardData.logoFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById('logoPreviewImg').src = e.target.result;
        document.getElementById('logoPreview').classList.add('visible');
        document.getElementById('logoUploadArea').classList.add('has-file');
    };
    reader.readAsDataURL(file);
};

window.removeLogo = function () {
    wizardData.logoFile = null;
    document.getElementById('logoFile').value = '';
    document.getElementById('logoPreview').classList.remove('visible');
    document.getElementById('logoUploadArea').classList.remove('has-file');
};

// ============================================
// STEP 8: CONTACT & REVIEW (was Step 7)
// ============================================

window.validateStep8 = function () {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();

    wizardData.fullName = SecurityUtils.sanitizeName(fullName);
    wizardData.email = SecurityUtils.sanitizeEmail(email);
    wizardData.phone = SecurityUtils.sanitizePhone(phone);
    wizardData.contactMethod = document.getElementById('contactMethod').value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = fullName && emailRegex.test(email) && phone.length >= 10;

    document.getElementById('payBtn').disabled = !isValid;
};

function populateReview() {
    // Backstop capture. Several inputs have no oninput, so their validate
    // function never fires — without this their values are silently dropped.
    if (typeof window.validateStep3 === 'function') window.validateStep3();
    if (typeof window.validateStep4 === 'function') window.validateStep4();

    // Capture content step data
    wizardData.contentReady = document.getElementById('contentReady').value;
    wizardData.additionalNotes = SecurityUtils.sanitizeLongText(document.getElementById('additionalNotes').value);

    // Package
    document.getElementById('reviewPackage').textContent =
        `${packageNames[wizardData.package]} - $${wizardData.packagePrice}`;

    // Domain
    document.getElementById('reviewDomain').textContent = wizardData.domain || 'Not specified';
    if (wizardData.domainOption === 'own') {
        document.getElementById('reviewDomainCostRow').style.display = 'none';
    } else {
        document.getElementById('reviewDomainCostRow').style.display = 'flex';
        document.getElementById('reviewDomainCost').textContent = `$${wizardData.domainPrice}/year`;
    }

    // Business Name
    document.getElementById('reviewBusinessName').textContent = wizardData.businessName;

    // Business Email (new)
    const businessEmailEl = document.getElementById('reviewBusinessEmail');
    if (businessEmailEl) {
        businessEmailEl.textContent = wizardData.businessEmail || '-';
    }

    // Primary Action
    document.getElementById('reviewPrimaryAction').textContent =
        actionNames[wizardData.primaryAction] || wizardData.primaryAction;

    // Design Style
    document.getElementById('reviewStyle').textContent =
        styleNames[wizardData.designStyle] || wizardData.designStyle;

    // Total
    const total = wizardData.packagePrice + wizardData.domainPrice;
    document.getElementById('reviewTotal').textContent = `$${total.toLocaleString()}`;
}

// ============================================
// PAYMENT PROCESSING
// ============================================

window.processPayment = async function () {
    // Rate limit check
    if (!FormRateLimiter.canSubmit()) {
        const cooldown = FormRateLimiter.getRemainingCooldown();
        alert(`Too many submission attempts. Please try again in ${cooldown} seconds.`);
        return;
    }

    // ✅ FIX: Capture all form data before submission (in case validate functions weren't triggered)
    validateStep4(); // Capture business contact info & checkboxes

    // Validate all data
    if (!wizardData.package || !wizardData.fullName || !wizardData.email) {
        alert('Please complete all required fields.');
        return;
    }

    // Attack detection
    const allText = [
        wizardData.businessName,
        wizardData.whatYouDo,
        wizardData.targetAudience,
        wizardData.fullName,
        wizardData.email,
        wizardData.additionalNotes,
        wizardData.businessEmail,
        wizardData.businessAddress
    ].join(' ');

    if (SecurityUtils.detectAttack(allText)) {
        alert('Invalid characters detected. Please review your input.');
        return;
    }

    const btn = document.getElementById('payBtn');
    btn.innerHTML = '<span class="loading-spinner"></span> Processing...';
    btn.disabled = true;

    FormRateLimiter.recordSubmission();

    try {
        const formData = new FormData();

        // Package info
        formData.append('package', `${packageNames[wizardData.package]} - $${wizardData.packagePrice}`);
        formData.append('packagePrice', wizardData.packagePrice);
        formData.append('category', wizardData.package);

        // Domain info
        formData.append('selectedDomain', wizardData.domain || 'N/A');
        formData.append('domainOption', wizardData.domainOption);
        formData.append('isOwnDomain', (wizardData.domainOption === 'own').toString());
        formData.append('domainPricing', JSON.stringify(wizardData.domainPricing));

        // About You (replaces old business details)
        formData.append('businessName', wizardData.businessName);
        formData.append('whatYouDo', wizardData.whatYouDo);
        formData.append('targetAudience', wizardData.targetAudience);
        formData.append('tagline', wizardData.tagline);

        // For backwards compatibility, combine into businessDescription
        formData.append('businessDescription', `${wizardData.whatYouDo} Target audience: ${wizardData.targetAudience}`);
        formData.append('industry', 'auto-detect'); // AI will infer from whatYouDo

        // Business Contact Info (NEW - for the website)
        formData.append('businessEmail', wizardData.businessEmail);
        formData.append('showBusinessEmail', wizardData.showBusinessEmail);
        formData.append('businessPhone', wizardData.businessPhone);
        formData.append('showBusinessPhone', wizardData.showBusinessPhone);
        formData.append('businessAddress', wizardData.businessAddress);
        formData.append('showBusinessAddress', wizardData.showBusinessAddress);
        formData.append('businessHours', wizardData.businessHours);
        formData.append('showBusinessHours', wizardData.showBusinessHours);

        // Social Media Links (NEW)
        formData.append('socialFacebook', wizardData.socialFacebook);
        formData.append('socialInstagram', wizardData.socialInstagram);
        formData.append('socialLinkedin', wizardData.socialLinkedin);
        formData.append('socialTwitter', wizardData.socialTwitter);

        // Bundle social links for AI
        const socialLinks = {
            facebook: wizardData.socialFacebook,
            instagram: wizardData.socialInstagram,
            linkedin: wizardData.socialLinkedin,
            twitter: wizardData.socialTwitter
        };
        formData.append('socialLinks', JSON.stringify(socialLinks));

        // Website Goals
        formData.append('primaryAction', wizardData.primaryAction);
        formData.append('features', JSON.stringify(wizardData.features));

        // Map primary action to pages for backwards compatibility
        const inferredPages = inferPagesFromAction(wizardData.primaryAction, wizardData.features);
        formData.append('pages', JSON.stringify(inferredPages));

        // Design preferences
        formData.append('designStyle', wizardData.designStyle);
        formData.append('brandColor', wizardData.brandColor);
        formData.append('inspirationUrl', wizardData.inspirationUrl);

        // Content
        formData.append('contentReady', wizardData.contentReady);
        formData.append('additionalNotes', wizardData.additionalNotes);
        if (wizardData.logoFile) {
            formData.append('logo', wizardData.logoFile);
        }

        // Contact info (customer's personal info for US to contact them)
        formData.append('name', wizardData.fullName);
        formData.append('email', wizardData.email);
        formData.append('phone', wizardData.phone);
        formData.append('contactMethod', wizardData.contactMethod);

        // Meta
        const totalCost = wizardData.packagePrice + wizardData.domainPrice;
        formData.append('totalCost', totalCost);
        formData.append('timestamp', new Date().toISOString());
        formData.append('status', 'pending_payment');
        formData.append('source', 'build_wizard');

        console.log('📦 Submitting order:', {
            package: wizardData.package,
            domain: wizardData.domain,
            email: wizardData.email,
            businessEmail: wizardData.businessEmail,
            primaryAction: wizardData.primaryAction,
            total: totalCost
        });

        const response = await fetch(ENDPOINTS.createPaymentSession, {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            if (result.requiresPayment === false) {
                showSuccess();
            } else if (result.sessionUrl) {
                window.location.href = result.sessionUrl;
            } else {
                showSuccess();
            }
        } else {
            throw new Error(result.error || "Payment session creation failed");
        }
    } catch (error) {
        console.error("Payment error:", error);
        alert('There was an error processing your request. Please try again or contact us at (415) 691-7085.');
        btn.innerHTML = 'Pay Now →';
        btn.disabled = false;
    }
};

// Helper: Infer pages from primary action and features
function inferPagesFromAction(action, features) {
    const pages = ['home'];

    // Based on primary action
    switch (action) {
        case 'contact':
        case 'book':
            pages.push('contact');
            break;
        case 'buy':
            pages.push('products', 'contact');
            break;
        case 'hire':
            pages.push('portfolio', 'about', 'contact');
            break;
        case 'subscribe':
            pages.push('about');
            break;
        case 'learn':
            pages.push('services', 'about');
            break;
    }

    // Based on features
    if (features.includes('gallery')) pages.push('gallery');
    if (features.includes('testimonials') && !pages.includes('testimonials')) pages.push('testimonials');
    if (features.includes('blog')) pages.push('blog');
    if (features.includes('team') && !pages.includes('about')) pages.push('about');
    if (features.includes('pricing')) pages.push('pricing');
    if (features.includes('faq')) pages.push('faq');

    // Ensure contact is included
    if (!pages.includes('contact')) pages.push('contact');

    // Remove duplicates
    return [...new Set(pages)];
}

function showSuccess() {
    document.getElementById('successEmail').textContent = wizardData.email;

    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById('stepSuccess').classList.add('active');

    document.getElementById('progressFill').style.width = '100%';
    document.getElementById('stepIndicator').textContent = 'Complete!';
    document.getElementById('stepName').textContent = 'Order Confirmed';
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const activeStep = document.querySelector('.step-content.active');
        const nextBtn = activeStep?.querySelector('.btn-wizard:not(.btn-back):not(:disabled)');
        if (nextBtn && !nextBtn.id?.includes('check')) {
            nextBtn.click();
        }
    }
});

// Domain search on Enter
document.addEventListener('DOMContentLoaded', () => {
    const domainInput = document.getElementById('domainSearchInput');
    if (domainInput) {
        domainInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkDomainAvailability();
            }
        });
    }

    // Initialize brand color listener
    const colorInput = document.getElementById('brandColor');
    if (colorInput) {
        colorInput.addEventListener('input', (e) => {
            wizardData.brandColor = e.target.value;
        });
    }

    // Initialize inspiration URL listener
    const inspirationInput = document.getElementById('inspirationUrl');
    if (inspirationInput) {
        inspirationInput.addEventListener('input', (e) => {
            wizardData.inspirationUrl = SecurityUtils.sanitizeUrl(e.target.value);
        });
    }

    // Initialize business email listener to auto-validate
    const businessEmailInput = document.getElementById('businessEmail');
    if (businessEmailInput) {
        businessEmailInput.addEventListener('input', () => {
            validateStep4();
        });
    }

    showStep(1);
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityUtils, FormRateLimiter, DomainCheckLimiter };
}
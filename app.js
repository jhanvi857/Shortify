// URL Shortener Application Script

// Mock domain for shortened URLs
const SHORT_DOMAIN = "http://lnk.red/";

// Default/mock items to seed the local storage on first visit
const MOCK_LINKS = [
    {
        code: "google",
        originalUrl: "https://www.google.com",
        shortUrl: SHORT_DOMAIN + "google",
        clicks: 42,
        created: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
        expiry: null,
        status: "Active"
    },
    {
        code: "dev-docs",
        originalUrl: "https://developer.mozilla.org/en-US/",
        shortUrl: SHORT_DOMAIN + "dev-docs",
        clicks: 128,
        created: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days ago
        expiry: null,
        status: "Active"
    },
    {
        code: "flash-sale",
        originalUrl: "https://news.ycombinator.com",
        shortUrl: SHORT_DOMAIN + "flash-sale",
        clicks: 19,
        created: Date.now() - (2 * 24 * 60 * 60 * 1000), // 2 days ago
        expiry: Date.now() - (1 * 24 * 60 * 60 * 1000), // expired 1 day ago
        status: "Expired"
    }
];

// State Management
let links = [];

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
    initStorage();
    renderTable();
    setupEventListeners();
});

// Load storage & seed if empty
function initStorage() {
    const stored = localStorage.getItem("shortened_urls");
    if (stored) {
        try {
            links = JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse stored URLs, resetting to default seed data.");
            links = [...MOCK_LINKS];
            saveStorage();
        }
    } else {
        links = [...MOCK_LINKS];
        saveStorage();
    }
}

// Save storage
function saveStorage() {
    localStorage.setItem("shortened_urls", JSON.stringify(links));
}

// Setup Event Listeners
function setupEventListeners() {
    const form = document.getElementById("shortener-form");
    const copyBtn = document.getElementById("copy-btn");
    const clearAllBtn = document.getElementById("clear-all-btn");
    
    // Form Submit
    form.addEventListener("submit", handleFormSubmit);

    // Copy to Clipboard
    copyBtn.addEventListener("click", handleCopyClick);

    // Clear All
    clearAllBtn.addEventListener("click", handleClearAll);

    // Intercept clicks on links globally to simulate redirection clicks
    document.addEventListener("click", handleGlobalLinkClicks);
}

// Form Submission Handler
function handleFormSubmit(e) {
    e.preventDefault();
    
    const longUrlInput = document.getElementById("long-url");
    const customAliasInput = document.getElementById("custom-alias");
    const expirySelect = document.getElementById("expiry-time");
    
    let originalUrl = longUrlInput.value.trim();
    let alias = customAliasInput.value.trim().toLowerCase();
    const expiryOption = expirySelect.value;

    // URL Validation & Auto-prepend Protocol if missing
    if (!/^https?:\/\//i.test(originalUrl)) {
        originalUrl = "https://" + originalUrl;
    }

    if (!isValidUrl(originalUrl)) {
        showToast("Please enter a valid URL.", "error");
        return;
    }

    // Alias verification
    if (alias) {
        if (!/^[a-z0-9-_]+$/.test(alias)) {
            showToast("Alias can only contain letters, numbers, hyphens, and underscores.", "error");
            return;
        }
        
        // Check for duplicates
        const exists = links.some(l => l.code === alias);
        if (exists) {
            showToast(`The alias "${alias}" is already taken.`, "error");
            return;
        }
    } else {
        // Generate random alias
        alias = generateRandomCode();
    }

    // Calculate Expiry
    let expiryTimestamp = null;
    if (expiryOption === "24h") {
        expiryTimestamp = Date.now() + (24 * 60 * 60 * 1000);
    } else if (expiryOption === "7d") {
        expiryTimestamp = Date.now() + (7 * 24 * 60 * 60 * 1000);
    }

    // Create short URL object
    const newLink = {
        code: alias,
        originalUrl: originalUrl,
        shortUrl: SHORT_DOMAIN + alias,
        clicks: 0,
        created: Date.now(),
        expiry: expiryTimestamp,
        status: "Active"
    };

    // Save and Render
    links.unshift(newLink); // Add to beginning
    saveStorage();
    renderTable();
    
    // Show Result Card
    showResult(newLink);
    
    // Reset Form
    form.reset();
    showToast("Link shortened successfully!", "success");
}

// Show Result Card
function showResult(link) {
    const resultSection = document.getElementById("result-section");
    const shortenedUrlText = document.getElementById("shortened-url-text");
    const originalPreviewText = document.getElementById("original-preview-text");
    
    // Update texts
    shortenedUrlText.textContent = link.shortUrl;
    shortenedUrlText.href = link.shortUrl;
    shortenedUrlText.dataset.code = link.code; // Store code for intercepting
    
    originalPreviewText.textContent = link.originalUrl;
    originalPreviewText.href = link.originalUrl;

    // Reset Copy Button
    const copyBtn = document.getElementById("copy-btn");
    copyBtn.classList.remove("copied");
    document.getElementById("copy-btn-text").textContent = "Copy link";

    // Draw QR Code
    // Make sure QRious library is loaded, else fallback
    try {
        if (typeof QRious !== "undefined") {
            new QRious({
                element: document.getElementById("qr-code-canvas"),
                value: link.shortUrl,
                size: 150,
                background: "#FFFFFF",
                foreground: "#A20021", // Accent color for QR code!
                level: "H"
            });
        }
    } catch (err) {
        console.error("Failed to generate QR code", err);
    }

    // Smooth scroll and display result section
    resultSection.classList.remove("hidden");
    resultSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// Copy Action Handler
function handleCopyClick() {
    const shortUrl = document.getElementById("shortened-url-text").textContent;
    
    navigator.clipboard.writeText(shortUrl).then(() => {
        const copyBtn = document.getElementById("copy-btn");
        const copyBtnText = document.getElementById("copy-btn-text");
        
        copyBtn.classList.add("copied");
        copyBtnText.textContent = "Copied!";
        
        // Reset after 1.5s
        setTimeout(() => {
            copyBtn.classList.remove("copied");
            copyBtnText.textContent = "Copy link";
        }, 1500);
    }).catch(err => {
        showToast("Failed to copy link.", "error");
        console.error("Clipboard copy failed: ", err);
    });
}

// Render the Links Table
function renderTable() {
    const tbody = document.getElementById("links-table-body");
    const linkCountBadge = document.getElementById("link-count");
    
    // Update link count badge
    linkCountBadge.textContent = `${links.length} Link${links.length === 1 ? "" : "s"}`;

    if (links.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state-row">
                <td colspan="6">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        <p>No shortened URLs yet</p>
                        <span>Your links and click analytics will appear here.</span>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Refresh expiry status for all links
    const now = Date.now();
    links.forEach(l => {
        if (l.expiry && now > l.expiry) {
            l.status = "Expired";
        } else {
            l.status = "Active";
        }
    });
    saveStorage();

    // Populate rows
    tbody.innerHTML = "";
    links.forEach((link, index) => {
        const tr = document.createElement("tr");
        
        const isExpired = link.status === "Expired";
        const statusBadge = isExpired 
            ? `<span class="badge badge-expired">Expired</span>`
            : `<span class="badge badge-active">Active</span>`;

        // Format dates
        const createdDate = formatDate(link.created);
        
        tr.innerHTML = `
            <td>
                <a href="${link.shortUrl}" class="table-short-url" data-code="${link.code}" target="_blank" rel="noopener noreferrer">${link.shortUrl}</a>
            </td>
            <td>
                <div class="table-original-url" title="${link.originalUrl}">
                    <a href="${link.originalUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.originalUrl)}</a>
                </div>
            </td>
            <td>
                <span class="table-clicks">${link.clicks}</span>
            </td>
            <td>
                <span class="table-date">${createdDate}</span>
            </td>
            <td>
                ${statusBadge}
            </td>
            <td>
                <button type="button" class="btn-delete-row" data-index="${index}" aria-label="Delete link">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });

    // Setup Row Delete listeners
    document.querySelectorAll(".btn-delete-row").forEach(btn => {
        btn.addEventListener("click", handleDeleteClick);
    });
}

// Delete Row Handler
function handleDeleteClick(e) {
    const btn = e.currentTarget;
    const index = parseInt(btn.dataset.index);
    
    // Fade out effect
    const row = btn.closest("tr");
    row.style.opacity = "0";
    row.style.transform = "translateX(10px)";
    row.style.transition = "all 0.2s ease";

    setTimeout(() => {
        links.splice(index, 1);
        saveStorage();
        renderTable();
        showToast("Link deleted from dashboard.", "success");
    }, 200);
}

// Clear All History Handler
function handleClearAll() {
    if (links.length === 0) return;
    
    if (confirm("Are you sure you want to clear your shortening history? This will delete all URLs and analytic counts.")) {
        links = [];
        saveStorage();
        renderTable();
        
        // Hide result section if it is shown
        document.getElementById("result-section").classList.add("hidden");
        showToast("All dashboard links cleared.", "success");
    }
}

// Intercept Short URL clicks to mock click analytics tracking
function handleGlobalLinkClicks(e) {
    const targetLink = e.target.closest("a");
    if (!targetLink) return;

    const code = targetLink.dataset.code;
    if (code) {
        // Find link
        const link = links.find(l => l.code === code);
        if (link) {
            // Check expiry
            if (link.expiry && Date.now() > link.expiry) {
                e.preventDefault();
                showToast("This link has expired and cannot be redirected.", "error");
                return;
            }

            // Increment clicks
            link.clicks++;
            saveStorage();
            renderTable();

            // Intercepting actual redirection so it redirects properly
            e.preventDefault();
            
            // Inform the user of simulation
            showToast(`Simulating Redirect to: ${link.originalUrl}`, "success");
            
            // Wait slightly so toast can be seen, then open tab
            setTimeout(() => {
                window.open(link.originalUrl, "_blank");
            }, 600);
        }
    }
}

// Utility: Generate random 6-character code
function generateRandomCode() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Utility: Format Timestamp to readable date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = { month: "short", day: "numeric", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
}

// Utility: Check if URL is valid
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Utility: Escape HTML to prevent injection
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Elegant Dynamic Toast Alert System
function showToast(message, type = "success") {
    // Check if container exists, else create it
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    const icon = type === "success" 
        ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animate-in
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 3000);
}

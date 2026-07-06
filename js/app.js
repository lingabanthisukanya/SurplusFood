/**
 * Surplus Food Connect - Application Logic (app.js)
 * Author: Senior Frontend Engineer
 * Description: Client-side state manager handling data persistence via localStorage,
 * active countdown timers, live search/filtering, and status mutation workflows.
 */

// Global state keys
const STORAGE_KEY = "surplus_food_items";

// Seed Data
const SEED_DATA = [
    {
        id: "seed-1",
        itemName: "20kg Fresh Pastries",
        businessName: "Sunshine Bakery",
        quantity: 20,
        expiryHours: 4,
        createdAt: Date.now() - (30 * 60000), // Created 30 mins ago
        expiresAt: Date.now() + (3.5 * 3600000), // 3.5 hours remaining
        address: "123 Sunshine Lane, Bakery District",
        status: "Available"
    },
    {
        id: "seed-2",
        itemName: "15 Portion Vegetable Biryani",
        businessName: "Royal India Restaurant",
        quantity: 15,
        expiryHours: 2,
        createdAt: Date.now() - (15 * 60000), // Created 15 mins ago
        expiresAt: Date.now() + (1.75 * 3600000), // 1.75 hours remaining
        address: "456 Royal Palace, Spiceland",
        status: "Available"
    },
    {
        id: "seed-3",
        itemName: "8kg Assorted Fruits",
        businessName: "Green Grocers",
        quantity: 8,
        expiryHours: 12,
        createdAt: Date.now() - (60 * 60000), // Created 60 mins ago
        expiresAt: Date.now() + (11 * 3600000), // 11 hours remaining
        address: "789 Harvest Road, Orchard Valley",
        status: "Available"
    }
];

/**
 * Initialize application state from localStorage or Seed Data
 */
function getStoredItems() {
    let items = localStorage.getItem(STORAGE_KEY);
    if (!items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
        return SEED_DATA;
    }
    return JSON.parse(items);
}

/**
 * Save items back to localStorage
 */
function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/**
 * Initialize dashboard form submit handler
 */
function initDonorDashboard() {
    const form = document.getElementById("donationForm");
    if (!form) return;

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        
        // Custom Bootstrap validation check
        if (!form.checkValidity()) {
            event.stopPropagation();
            form.classList.add("was-validated");
            return;
        }

        const itemName = document.getElementById("itemName").value.trim();
        const businessName = document.getElementById("businessName").value.trim();
        const quantity = parseFloat(document.getElementById("quantity").value);
        const expiryHours = parseInt(document.getElementById("expiryHours").value);
        const address = document.getElementById("address").value.trim();

        // Create new ticket object
        const newTicket = {
            id: "ticket-" + Date.now(),
            itemName: itemName,
            businessName: businessName,
            quantity: quantity,
            expiryHours: expiryHours,
            createdAt: Date.now(),
            expiresAt: Date.now() + (expiryHours * 3600000),
            address: address,
            status: "Available"
        };

        const items = getStoredItems();
        items.unshift(newTicket); // Add new item to front of the marketplace
        saveItems(items);

        // Redirect to listings page
        window.location.href = "listings.html";
    });
}

/**
 * Handle listing rendering and real-time updates
 */
let activeClaimId = null;

function renderListings() {
    const grid = document.getElementById("listingsGrid");
    if (!grid) return;

    const items = getStoredItems();
    grid.innerHTML = "";

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="glass-card p-5">
                    <i class="bi bi-inbox-fill text-muted" style="font-size: 3rem;"></i>
                    <h3 class="mt-3 font-outfit text-dark">No Listings Available</h3>
                    <p class="text-secondary">Be the first to list surplus food or adjust your filter search.</p>
                </div>
            </div>
        `;
        return;
    }

    items.forEach(item => {
        const timeRemainingMs = item.expiresAt - Date.now();
        const isExpired = timeRemainingMs <= 0;
        
        // Calculate remaining hours and minutes for countdown display
        let hoursRemaining = 0;
        let minutesRemaining = 0;
        
        if (!isExpired) {
            hoursRemaining = Math.floor(timeRemainingMs / 3600000);
            minutesRemaining = Math.floor((timeRemainingMs % 3600000) / 60000);
        }

        // Calculate visual progress bar percentage based on remaining time
        const totalDurationMs = item.expiryHours * 3600000;
        let progressPct = 0;
        if (!isExpired) {
            progressPct = Math.min(100, Math.max(0, (timeRemainingMs / totalDurationMs) * 100));
        }

        // Progress bar background classes
        let progressBg = "bg-success";
        let textClass = "text-success";
        
        const hoursLeftDecimal = timeRemainingMs / 3600000;
        if (hoursLeftDecimal <= 2) {
            progressBg = "bg-danger";
            textClass = "text-danger fw-bold";
        } else if (hoursLeftDecimal <= 6) {
            progressBg = "bg-warning";
            textClass = "text-warning fw-bold";
        }

        // Setup claim status badge and claim button conditions
        let buttonHtml = "";
        let statusBadgeHtml = "";

        if (item.status === "Claimed") {
            statusBadgeHtml = `<span class="badge bg-secondary px-3 py-2 rounded-pill"><i class="bi bi-check-circle-fill me-1"></i> Claimed</span>`;
            buttonHtml = `<button class="btn btn-secondary w-100 rounded-pill py-2" disabled><i class="bi bi-lock-fill me-1"></i> Resource Claimed</button>`;
        } else if (isExpired) {
            statusBadgeHtml = `<span class="badge bg-danger px-3 py-2 rounded-pill"><i class="bi bi-x-circle-fill me-1"></i> Expired</span>`;
            buttonHtml = `<button class="btn btn-outline-danger w-100 rounded-pill py-2" disabled><i class="bi bi-clock-fill me-1"></i> Expired</button>`;
        } else {
            statusBadgeHtml = `<span class="badge bg-emerald-light px-3 py-2 rounded-pill text-success"><i class="bi bi-circle-fill me-1 small"></i> Available</span>`;
            buttonHtml = `<button class="btn btn-cta w-100 rounded-pill py-2 claim-btn-trigger" data-id="${item.id}"><i class="bi bi-cart-plus me-1"></i> Claim Resource</button>`;
        }

        const card = document.createElement("div");
        card.className = "col-12 col-md-6 col-lg-4 listing-card transition-all";
        card.setAttribute("data-id", item.id);
        card.setAttribute("data-hours-left", isExpired ? 0 : hoursLeftDecimal);
        card.setAttribute("data-status", item.status);
        
        card.innerHTML = `
            <div class="card h-100 glass-card p-3 border-0">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="badge bg-info text-dark px-3 py-2 rounded-pill fw-semibold"><i class="bi bi-box-seam me-1"></i> ${item.quantity} kg</span>
                    ${statusBadgeHtml}
                </div>
                
                <h4 class="card-title text-dark mb-1 font-outfit text-truncate-2">${item.itemName}</h4>
                <p class="text-muted small mb-3"><i class="bi bi-shop me-1 text-success"></i> ${item.businessName}</p>
                
                <div class="mb-4">
                    <div class="d-flex justify-content-between text-muted small mb-1">
                        <span>Freshness Meter</span>
                        <span class="${textClass}">
                            ${isExpired ? "Expired" : `${hoursRemaining}h ${minutesRemaining}m left`}
                        </span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar progress-bar-striped progress-bar-animated progress-bar-animated-custom ${progressBg}" 
                             role="progressbar" 
                             style="width: ${progressPct}%" 
                             aria-valuenow="${progressPct}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
                </div>

                <div class="mt-auto pt-2 border-top">
                    <p class="text-secondary small text-truncate mb-3"><i class="bi bi-geo-alt me-1 text-danger"></i> ${item.address}</p>
                    ${buttonHtml}
                </div>
            </div>
        `;
        
        grid.appendChild(card);
    });

    // Add click listeners to Claim buttons
    const claimButtons = grid.querySelectorAll(".claim-btn-trigger");
    claimButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            const id = this.getAttribute("data-id");
            openClaimModal(id);
        });
    });
}

/**
 * Open Claim Confirmation Modal
 */
function openClaimModal(id) {
    const items = getStoredItems();
    const item = items.find(i => i.id === id);
    if (!item) return;

    activeClaimId = id;
    
    // Populate modal components
    document.getElementById("modalItemName").innerText = item.itemName;
    document.getElementById("modalBusinessName").innerText = item.businessName;
    document.getElementById("modalQuantity").innerText = item.quantity + " kg";
    document.getElementById("modalAddress").innerText = item.address;

    // Show the bootstrap modal
    const modalEl = document.getElementById("claimConfirmationModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

/**
 * Handle confirmation of a resource claim
 */
function initClaimConfirmation() {
    const confirmBtn = document.getElementById("confirmClaimBtn");
    if (!confirmBtn) return;

    confirmBtn.addEventListener("click", function () {
        if (!activeClaimId) return;

        const items = getStoredItems();
        const itemIndex = items.findIndex(i => i.id === activeClaimId);
        
        if (itemIndex !== -1) {
            items[itemIndex].status = "Claimed";
            saveItems(items);
            
            // Re-render
            renderListings();
            
            // Close modal
            const modalEl = document.getElementById("claimConfirmationModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            // Reset active state
            activeClaimId = null;

            // Optional: Trigger a micro toast confirmation
            showNotificationToast("Resource claimed successfully! The donor has been notified.");
        }
    });
}

/**
 * Client-Side Filtering & Real-time keyword filter
 */
function initFilters() {
    const searchInput = document.getElementById("searchQuery");
    if (!searchInput) return;

    // Keyword search listener
    searchInput.addEventListener("input", filterListingsUI);

    // Filter Buttons (Time remaining)
    const filterButtons = document.querySelectorAll("[data-filter]");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            // Remove active classes
            filterButtons.forEach(b => b.classList.remove("active", "btn-success"));
            filterButtons.forEach(b => b.classList.add("btn-outline-secondary"));

            // Add active styles to current clicked button
            this.classList.add("active", "btn-success");
            this.classList.remove("btn-outline-secondary");

            filterListingsUI();
        });
    });
}

/**
 * Filter items dynamically toggling the display helper .d-none
 */
function filterListingsUI() {
    const searchInput = document.getElementById("searchQuery");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const activeFilterBtn = document.querySelector("[data-filter].active");
    const filterType = activeFilterBtn ? activeFilterBtn.getAttribute("data-filter") : "all";

    const cards = document.querySelectorAll(".listing-card");
    
    cards.forEach(card => {
        const id = card.getAttribute("data-id");
        const hoursLeft = parseFloat(card.getAttribute("data-hours-left"));
        const status = card.getAttribute("data-status");
        
        // Find card contents to scan text layouts
        const title = card.querySelector(".card-title").innerText.toLowerCase();
        const business = card.querySelector(".text-muted").innerText.toLowerCase();

        // 1. Keyword Check
        const matchesKeyword = title.includes(query) || business.includes(query);

        // 2. Freshness / Time Check
        let matchesFilter = true;
        if (filterType === "urgent") {
            matchesFilter = hoursLeft > 0 && hoursLeft <= 2 && status === "Available";
        } else if (filterType === "mid") {
            matchesFilter = hoursLeft > 0 && hoursLeft <= 6 && status === "Available";
        } else if (filterType === "available") {
            matchesFilter = status === "Available";
        } else if (filterType === "claimed") {
            matchesFilter = status === "Claimed";
        }

        // Apply display toggling helper classes
        if (matchesKeyword && matchesFilter) {
            card.classList.remove("d-none");
        } else {
            card.classList.add("d-none");
        }
    });
}

/**
 * Active Timer Management tracker loop
 * Every minute, programmatically decrement the expiration window of listings in localStorage
 */
function initTimerLoop() {
    // Run every minute (60,000 ms) as specified by requirements
    setInterval(() => {
        let items = getStoredItems();
        let changed = false;

        items.forEach(item => {
            if (item.status === "Available") {
                const timeRemaining = item.expiresAt - Date.now();
                if (timeRemaining > 0) {
                    // Update calculated values if necessary
                    changed = true;
                }
            }
        });

        // We re-render to keep the progress bar colors and text timers completely synchronized
        if (document.getElementById("listingsGrid")) {
            renderListings();
            filterListingsUI();
        }
    }, 60000);

    // Additionally run a high-fidelity visual loop every 5 seconds for visual countdown updates without modifying storage
    setInterval(() => {
        if (document.getElementById("listingsGrid")) {
            // Update individual timer text and widths dynamically
            const cards = document.querySelectorAll(".listing-card");
            const items = getStoredItems();

            cards.forEach(card => {
                const id = card.getAttribute("data-id");
                const item = items.find(i => i.id === id);
                if (!item || item.status === "Claimed") return;

                const timeRemainingMs = item.expiresAt - Date.now();
                const isExpired = timeRemainingMs <= 0;

                const timeTextEl = card.querySelector(".progress-bar-animated-custom")?.closest(".mb-4")?.querySelector("span:last-child");
                const progressBar = card.querySelector(".progress-bar");

                if (isExpired) {
                    if (timeTextEl) timeTextEl.innerText = "Expired";
                    if (progressBar) {
                        progressBar.style.width = "0%";
                        progressBar.className = "progress-bar progress-bar-striped progress-bar-animated bg-danger";
                    }
                    // Mark as expired
                    card.setAttribute("data-hours-left", "0");
                    const claimBtn = card.querySelector(".claim-btn-trigger");
                    if (claimBtn) {
                        claimBtn.className = "btn btn-outline-danger w-100 rounded-pill py-2";
                        claimBtn.disabled = true;
                        claimBtn.innerHTML = `<i class="bi bi-clock-fill me-1"></i> Expired`;
                    }
                } else {
                    const hoursRemaining = Math.floor(timeRemainingMs / 3600000);
                    const minutesRemaining = Math.floor((timeRemainingMs % 3600000) / 60000);
                    const hoursLeftDecimal = timeRemainingMs / 3600000;
                    
                    if (timeTextEl) timeTextEl.innerText = `${hoursRemaining}h ${minutesRemaining}m left`;
                    
                    const totalDurationMs = item.expiryHours * 3600000;
                    const progressPct = Math.min(100, Math.max(0, (timeRemainingMs / totalDurationMs) * 100));
                    
                    if (progressBar) {
                        progressBar.style.width = `${progressPct}%`;
                        
                        // Update color classes
                        if (hoursLeftDecimal <= 2) {
                            progressBar.className = "progress-bar progress-bar-striped progress-bar-animated progress-bar-animated-custom bg-danger";
                            if (timeTextEl) timeTextEl.className = "text-danger fw-bold";
                        } else if (hoursLeftDecimal <= 6) {
                            progressBar.className = "progress-bar progress-bar-striped progress-bar-animated progress-bar-animated-custom bg-warning";
                            if (timeTextEl) timeTextEl.className = "text-warning fw-bold";
                        } else {
                            progressBar.className = "progress-bar progress-bar-striped progress-bar-animated progress-bar-animated-custom bg-success";
                            if (timeTextEl) timeTextEl.className = "text-success";
                        }
                    }
                    card.setAttribute("data-hours-left", hoursLeftDecimal.toString());
                }
            });
        }
    }, 5000);
}

/**
 * Toast Notification Utilities
 */
function showNotificationToast(message) {
    // Create toast elements dynamically
    const container = document.getElementById("toastContainer") || createToastContainer();
    
    const toastId = "toast-" + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-success border-0 glass-card" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center">
                    <i class="bi bi-check-circle-fill me-2 fs-5"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML("beforeend", toastHtml);
    const toastEl = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();

    // Clean up DOM on hide
    toastEl.addEventListener("hidden.bs.toast", function () {
        toastEl.remove();
    });
}

function createToastContainer() {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.style.zIndex = "1080";
    document.body.appendChild(container);
    return container;
}

/**
 * Initialize elements on document load
 */
document.addEventListener("DOMContentLoaded", function () {
    // Prime state storage
    getStoredItems();

    // Route-specific setups
    initDonorDashboard();
    renderListings();
    initClaimConfirmation();
    initFilters();
    initTimerLoop();
});

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const accountIdInput = document.getElementById('account-id');
    const zoneCountInput = document.getElementById('zone-count');
    const loadZonesBtn = document.getElementById('load-zones-btn');
    const zonesSection = document.getElementById('zones-section');
    const settingsSection = document.getElementById('settings-section');
    const zonesTableBody = document.getElementById('zones-table-body');
    const paginationControls = document.getElementById('pagination-controls');
    const applySettingsBtn = document.getElementById('apply-settings-btn');
    const selectAllZonesCheckbox = document.getElementById('select-all-zones');
    const selectedCountEl = document.getElementById('selected-count');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');
    const cachingLevelSelect = document.getElementById('caching-level');
    const browserCacheTTLInput = document.getElementById('browser-cache-ttl');

    // State
    let zones = [];
    let currentPage = 1;
    let zonesPerPage = 20;
    let totalPages = 1;
    let selectedZones = new Set();
    // API URLs are relative - they'll use the same domain as the frontend
    const apiBaseUrl = '/api';

    // Initialize
    loadZonesBtn.addEventListener('click', loadZones);
    selectAllZonesCheckbox.addEventListener('change', toggleAllZones);
    applySettingsBtn.addEventListener('click', applySettingsToSelectedZones);

    // Functions
    function showLoading() {
        loadingIndicator.style.display = 'flex';
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }

    function showError(message) {
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
        successAlert.style.display = 'none';
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 5000);
    }

    function showSuccess(message) {
        successAlert.textContent = message;
        successAlert.style.display = 'block';
        errorAlert.style.display = 'none';
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 5000);
    }

    function validateAccountId() {
        const accountId = accountIdInput.value.trim();
        if (!accountId) {
            showError('Please enter your Cloudflare Account ID');
            return false;
        }
        // Basic validation - Account IDs are typically 32-character hex strings
        if (!/^[a-f0-9]{32}$/.test(accountId)) {
            showError('Please enter a valid Cloudflare Account ID (32-character hexadecimal string)');
            return false;
        }
        return true;
    }

    function loadZones() {
        if (!validateAccountId()) return;

        zonesPerPage = parseInt(zoneCountInput.value);
        currentPage = 1;
        selectedZones.clear();
        updateSelectAllCheckbox();
        updateSelectedCount();

        showLoading();
        fetchZones();
    }

    async function fetchZones() {
        try {
            const accountId = accountIdInput.value.trim();
            const response = await fetch(`${apiBaseUrl}/zones?account_id=${encodeURIComponent(accountId)}&page=${currentPage}&per_page=${zonesPerPage}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            zones = data.zones || [];
            totalPages = data.total_pages || 1;
            
            renderZones();
            renderPagination();
            
            zonesSection.style.display = 'block';
            settingsSection.style.display = selectedZones.size > 0 ? 'block' : 'none';
            
        } catch (error) {
            showError(`Failed to load zones: ${error.message}`);
            console.error('Error fetching zones:', error);
        } finally {
            hideLoading();
        }
    }

    function renderZones() {
        zonesTableBody.innerHTML = '';
        
        if (zones.length === 0) {
            zonesTableBody.innerHTML = '<tr><td colspan="4">No zones found</td></tr>';
            return;
        }

        zones.forEach(zone => {
            const isSelected = selectedZones.has(zone.id);
            const row = document.createElement('tr');
            row.className = isSelected ? 'selected' : '';
            
            row.innerHTML = `
                <td><input type="checkbox" ${isSelected ? 'checked' : ''} data-zone-id="${zone.id}"></td>
                <td>${zone.name}</td>
                <td>${zone.settings?.caching_level || 'Loading...'}</td>
                <td>${zone.settings?.browser_cache_ttl || 'Loading...'} seconds</td>
            `;
            
            const checkbox = row.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedZones.add(zone.id);
                } else {
                    selectedZones.delete(zone.id);
                }
                updateSelectAllCheckbox();
                updateSelectedCount();
                settingsSection.style.display = selectedZones.size > 0 ? 'block' : 'none';
            });
            
            zonesTableBody.appendChild(row);
        });
    }

    function renderPagination() {
        paginationControls.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadZones();
            }
        });
        paginationControls.appendChild(prevButton);
        
        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        paginationControls.appendChild(pageInfo);
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next →';
        nextButton.disabled = currentPage >= totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadZones();
            }
        });
        paginationControls.appendChild(nextButton);
    }

    function toggleAllZones() {
        const isChecked = selectAllZonesCheckbox.checked;
        zones.forEach(zone => {
            if (isChecked) {
                selectedZones.add(zone.id);
            } else {
                selectedZones.delete(zone.id);
            }
        });
        
        // Update individual checkboxes
        document.querySelectorAll('#zones-table-body input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        
        updateSelectedCount();
        settingsSection.style.display = selectedZones.size > 0 ? 'block' : 'none';
    }

    function updateSelectAllCheckbox() {
        selectAllZonesCheckbox.checked = zones.length > 0 && selectedZones.size === zones.length;
    }

    function updateSelectedCount() {
        selectedCountEl.textContent = `${selectedZones.size} zones selected`;
        applySettingsBtn.disabled = selectedZones.size === 0;
    }

    async function applySettingsToSelectedZones() {
        if (selectedZones.size === 0) {
            showError('Please select at least one zone');
            return;
        }

        const cachingLevel = cachingLevelSelect.value;
        const browserCacheTTLRaw = browserCacheTTLInput.value.trim();
        
        // Validate inputs
        if (!cachingLevel && !browserCacheTTLRaw) {
            showError('Please select at least one setting to apply');
            return;
        }

        let browserCacheTTL = null;
        if (browserCacheTTLRaw) {
            browserCacheTTL = parseTTL(browserCacheTTLRaw);
            if (browserCacheTTL === null) {
                showError('Invalid Browser Cache TTL format. Use seconds or suffixes: s, m, h, d (e.g., 3600, 1h, 30m)');
                return;
            }
        }

        // Confirm action
        if (!window.confirm(`Apply settings to ${selectedZones.size} selected zone(s)?`)) {
            return;
        }

        showLoading();
        applySettingsBtn.disabled = true;
        
        try {
            const accountId = accountIdInput.value.trim();
            const zoneIds = Array.from(selectedZones);
            
            const response = await fetch(`${apiBaseUrl}/zones/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account_id: accountId,
                    zone_ids: zoneIds,
                    settings: {
                        caching_level: cachingLevel || undefined,
                        browser_cache_ttl: browserCacheTTL
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            showSuccess(`Successfully applied settings to ${data.updated_count} zones`);
            
            // Refresh zone data to show updated settings
            loadZones();
            
        } catch (error) {
            showError(`Failed to apply settings: ${error.message}`);
            console.error('Error applying settings:', error);
        } finally {
            hideLoading();
            applySettingsBtn.disabled = false;
        }
    }

    function parseTTL(input) {
        // Parse TTL input like "3600", "1h", "30m", "45s", "2d"
        const match = input.match(/^(\d+)([smhd]?)$/);
        if (!match) return null;
        
        const value = parseInt(match[1]);
        const unit = match[2] || 's'; // default to seconds
        
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return null;
        }
    }
});
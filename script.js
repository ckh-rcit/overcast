import { ZONE_SETTINGS, getSettingById } from './shared/settings-config.js';

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
    const zonesCountEl = document.getElementById('zones-count');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');

    // State
    let zones = [];
    let currentPage = 1;
    let zonesPerPage = 20;
    let totalPages = 1;
    let selectedZones = new Set();
    const apiBaseUrl = '/api';
    let configuredAccountId = null;

    // Initialize
    checkServerConfig();
    initializeSettingsControls();
    attachDirtyStateTracking();

    // Event listeners
    loadZonesBtn.addEventListener('click', loadZones);
    selectAllZonesCheckbox.addEventListener('change', toggleAllZones);
    applySettingsBtn.addEventListener('click', applySettingsToSelectedZones);

    // Check if account ID is configured on server
    async function checkServerConfig() {
        try {
            const response = await fetch(`${apiBaseUrl}/config`);
            if (response.ok) {
                const config = await response.json();
                if (config.hasAccountId && config.accountId) {
                    configuredAccountId = config.accountId;
                    accountIdInput.value = configuredAccountId;
                    accountIdInput.disabled = true;
                    accountIdInput.placeholder = 'Configured via environment variable';
                    
                    // Add helpful note
                    const note = document.createElement('small');
                    note.className = 'text-secondary';
                    note.style.display = 'block';
                    note.style.marginTop = '4px';
                    note.textContent = '✓ Account ID configured server-side';
                    accountIdInput.parentElement.appendChild(note);
                }
            }
        } catch (error) {
            console.log('Could not check server config:', error);
        }
    }

    // Functions
    function initializeSettingsControls() {
        // Populate all select dropdowns with their options from config
        ZONE_SETTINGS.forEach(setting => {
            const element = document.getElementById(`setting-${setting.id}`);
            if (!element) return;

            if (setting.type === 'select' && setting.options) {
                // Clear existing options except the "No Change" option
                element.innerHTML = '<option value="">-- No Change --</option>';
                
                // Add all options from config
                setting.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    element.appendChild(option);
                });
            }
        });
    }

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
        }, 8000);
    }

    function showSuccess(message) {
        successAlert.textContent = message;
        successAlert.style.display = 'block';
        errorAlert.style.display = 'none';
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 8000);
    }

    function validateAccountId() {
        // If account ID is configured server-side, skip validation
        if (configuredAccountId) {
            return true;
        }
        
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
            const accountId = configuredAccountId || accountIdInput.value.trim();
            
            // Build URL - only include account_id param if not configured server-side
            let url = `${apiBaseUrl}/zones?page=${currentPage}&per_page=${zonesPerPage}`;
            if (!configuredAccountId && accountId) {
                url += `&account_id=${encodeURIComponent(accountId)}`;
            }
            
            const response = await fetch(url);

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
            updateZonesCount(data.total_count);
            
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
            zonesTableBody.innerHTML = '<tr><td colspan="7" class="text-secondary">No zones found</td></tr>';
            return;
        }

        zones.forEach(zone => {
            const isSelected = selectedZones.has(zone.id);
            const row = document.createElement('tr');
            row.className = isSelected ? 'selected' : '';
            
            // Format values for display
            const status = zone.status || 'unknown';
            const cachingLevel = zone.settings?.caching_level || 'N/A';
            const browserCacheTTL = formatBrowserCacheTTL(zone.settings?.browser_cache_ttl);
            const sslMode = zone.settings?.ssl || 'N/A';
            const securityLevel = zone.settings?.security_level || 'N/A';
            
            row.innerHTML = `
                <td><input type="checkbox" ${isSelected ? 'checked' : ''} data-zone-id="${zone.id}"></td>
                <td>${zone.name}</td>
                <td><span class="badge badge-${status === 'active' ? 'on' : 'off'}">${status}</span></td>
                <td>${cachingLevel}</td>
                <td>${browserCacheTTL}</td>
                <td>${sslMode}</td>
                <td>${securityLevel}</td>
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

    function formatBrowserCacheTTL(ttl) {
        if (!ttl) return 'N/A';
        if (ttl === 0) return 'Respect Headers';
        
        // Convert seconds to human-readable format
        const days = Math.floor(ttl / 86400);
        const hours = Math.floor((ttl % 86400) / 3600);
        const minutes = Math.floor((ttl % 3600) / 60);
        
        if (days > 0) return `${days}d`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}m`;
        return `${ttl}s`;
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
                showLoading();
                fetchZones();
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
                showLoading();
                fetchZones();
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
        selectedCountEl.textContent = `${selectedZones.size} zone${selectedZones.size !== 1 ? 's' : ''} selected`;
        applySettingsBtn.disabled = selectedZones.size === 0;
    }

    function updateZonesCount(totalCount) {
        if (!zonesCountEl || !totalCount) return;
        
        const startIndex = (currentPage - 1) * zonesPerPage + 1;
        const endIndex = Math.min(currentPage * zonesPerPage, totalCount);
        
        zonesCountEl.textContent = `Showing ${startIndex}-${endIndex} of ${totalCount} zones`;
    }

    function attachDirtyStateTracking() {
        // Track changes to all setting inputs
        document.querySelectorAll('.setting-input').forEach(input => {
            input.addEventListener('change', () => {
                updateDirtyState(input);
            });
        });
    }

    function updateDirtyState(input) {
        const settingId = input.id.replace('setting-', '');
        const settingConfig = getSettingById(settingId);
        
        if (!settingConfig) return;
        
        let isDirty = false;
        
        if (input.type === 'checkbox') {
            // For checkboxes, consider them dirty if checked
            isDirty = input.checked;
        } else if (input.tagName === 'SELECT') {
            // For selects, consider them dirty if not empty
            isDirty = input.value !== '';
        }
        
        // Add/remove dirty class
        if (isDirty) {
            input.classList.add('dirty');
        } else {
            input.classList.remove('dirty');
        }
        
        // Update category indicator
        updateCategoryDirtyState(settingConfig.category);
    }

    function updateCategoryDirtyState(category) {
        // Find all settings in this category
        const categorySettings = ZONE_SETTINGS.filter(s => s.category === category);
        const hasChanges = categorySettings.some(setting => {
            const input = document.getElementById(`setting-${setting.id}`);
            return input && input.classList.contains('dirty');
        });
        
        // Find the category element and update its state
        const categoryElements = document.querySelectorAll('.settings-category');
        categoryElements.forEach(el => {
            const heading = el.querySelector('h3');
            if (heading && heading.textContent.includes(getCategoryLabel(category))) {
                if (hasChanges) {
                    el.classList.add('has-changes');
                } else {
                    el.classList.remove('has-changes');
                }
            }
        });
    }

    function getCategoryLabel(category) {
        const categoryMap = {
            'cache': 'Cache Settings',
            'ssl': 'SSL/TLS Settings',
            'security': 'Security Settings',
            'network': 'Network Settings',
            'speed': 'Speed & Optimization',
            'scrape_shield': 'Scrape Shield'
        };
        return categoryMap[category] || category;
    }

    async function applySettingsToSelectedZones() {
        if (selectedZones.size === 0) {
            showError('Please select at least one zone');
            return;
        }

        // Collect all settings that have been changed
        const settings = {};
        let hasChanges = false;

        ZONE_SETTINGS.forEach(settingConfig => {
            const element = document.getElementById(`setting-${settingConfig.id}`);
            if (!element) return;

            let value;
            
            if (settingConfig.type === 'toggle') {
                // For toggle switches, check if parent element has the toggle-switch class
                const toggleContainer = element.closest('.toggle-switch');
                if (toggleContainer) {
                    // Only include if checkbox is checked (meaning user wants to enable it)
                    // We'll need a way to know if user touched it - for now, we skip unchecked toggles
                    // This is a limitation - we might need "3-state" toggles (on/off/no-change)
                    // For simplicity, we'll include all checked toggles
                    if (element.checked) {
                        value = true;
                        hasChanges = true;
                    }
                }
            } else if (settingConfig.type === 'select') {
                value = element.value;
                if (value !== '') {  // Empty string means "No Change"
                    // Convert numeric strings to numbers where appropriate
                    if (settingConfig.id === 'browser_cache_ttl' || settingConfig.id === 'challenge_ttl') {
                        value = parseInt(value);
                    }
                    hasChanges = true;
                }
            }

            if (value !== undefined && value !== '') {
                settings[settingConfig.id] = value;
            }
        });

        if (!hasChanges) {
            showError('Please select at least one setting to apply');
            return;
        }

        // Confirm action
        const settingsCount = Object.keys(settings).length;
        if (!window.confirm(`Apply ${settingsCount} setting(s) to ${selectedZones.size} selected zone(s)?`)) {
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
                    settings: settings
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            showSuccess(`✓ Successfully applied ${settingsCount} setting(s) to ${data.updated_count} of ${selectedZones.size} zone(s)`);
            
            // Clear form inputs after successful application
            resetSettingsForm();
            
            // Refresh zone data to show updated settings
            setTimeout(() => {
                showLoading();
                fetchZones();
            }, 1500);
            
        } catch (error) {
            showError(`Failed to apply settings: ${error.message}`);
            console.error('Error applying settings:', error);
        } finally {
            hideLoading();
            applySettingsBtn.disabled = false;
        }
    }

    function resetSettingsForm() {
        // Reset all select dropdowns to "No Change"
        document.querySelectorAll('.setting-input[type="checkbox"]').forEach(input => {
            input.checked = false;
            input.classList.remove('dirty');
        });
        
        document.querySelectorAll('.setting-input').forEach(input => {
            if (input.tagName === 'SELECT') {
                input.value = '';
                input.classList.remove('dirty');
            }
        });
        
        // Clear all category dirty states
        document.querySelectorAll('.settings-category').forEach(el => {
            el.classList.remove('has-changes');
        });
    }
});

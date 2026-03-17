import { ZONE_SETTINGS, getSettingById } from './shared/settings-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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
    const progressIndicator = document.getElementById('progress-indicator');
    const progressBar = document.getElementById('progress-bar');
    const progressCount = document.getElementById('progress-count');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressSummary = document.getElementById('progress-summary');
    const progressDetails = document.getElementById('progress-details');
    const progressActions = document.getElementById('progress-actions');
    const dismissProgressBtn = document.getElementById('dismiss-progress-btn');
    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');

    // State
    let allZones = []; // Store ALL zones
    let zones = []; // Current page of zones to display
    let currentPage = 1;
    let zonesPerPage = 20;
    let totalPages = 1;
    let selectedZones = new Set();
    const apiBaseUrl = '/api';

    // Initialize
    initializeSettingsControls();
    attachDirtyStateTracking();

    // Event listeners
    loadZonesBtn.addEventListener('click', loadZones);
    selectAllZonesCheckbox.addEventListener('change', toggleAllZones);
    applySettingsBtn.addEventListener('click', applySettingsToSelectedZones);
    dismissProgressBtn.addEventListener('click', () => {
        hideProgress();
        // Refresh zones to show updated data
        showLoading();
        fetchAllZones();
    });

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

    function loadZones() {
        currentPage = 1;
        selectedZones.clear();
        updateSelectAllCheckbox();
        updateSelectedCount();

        showLoading();
        fetchAllZones();
    }

    async function fetchAllZones() {
        try {
            // Fetch all zones by requesting a large per_page value
            // Cloudflare API typically supports up to 1000 zones per request
            const url = `${apiBaseUrl}/zones?page=1&per_page=1000`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Store ALL zones
            allZones = data.zones || [];
            
            // Calculate pagination based on client-side zonesPerPage
            updatePagination();
            
            // Display first page
            displayCurrentPage();
            
            zonesSection.style.display = 'block';
            settingsSection.style.display = selectedZones.size > 0 ? 'block' : 'none';
            
        } catch (error) {
            showError(`Failed to load zones: ${error.message}`);
            console.error('Error fetching zones:', error);
        } finally {
            hideLoading();
        }
    }

    function updatePagination() {
        // Calculate total pages based on all zones and current zonesPerPage
        totalPages = Math.ceil(allZones.length / zonesPerPage);
        if (totalPages === 0) totalPages = 1;
        
        // Ensure current page is valid
        if (currentPage > totalPages) {
            currentPage = totalPages;
        }
    }

    function displayCurrentPage() {
        // Get the slice of zones for current page
        const startIndex = (currentPage - 1) * zonesPerPage;
        const endIndex = startIndex + zonesPerPage;
        zones = allZones.slice(startIndex, endIndex);
        
        renderZones();
        renderPagination();
        updateZonesCount();
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
            const cachingLevel = formatSettingValue('cache_level', zone.settings?.cache_level);
            const browserCacheTTL = formatBrowserCacheTTL(zone.settings?.browser_cache_ttl);
            const sslMode = formatSettingValue('ssl', zone.settings?.ssl);
            const securityLevel = formatSettingValue('security_level', zone.settings?.security_level);
            
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

    function formatSettingValue(settingId, value) {
        if (value === undefined || value === null) return 'N/A';
        
        // Look up the setting config
        const setting = getSettingById(settingId);
        if (!setting) return value.toString();
        
        // For select-type settings, look up the label from options
        if (setting.type === 'select' && setting.options) {
            const option = setting.options.find(opt => opt.value == value);
            return option ? option.label : value.toString();
        }
        
        // For toggle-type settings, return On/Off
        if (setting.type === 'toggle') {
            return value ? 'On' : 'Off';
        }
        
        return value.toString();
    }

    function formatBrowserCacheTTL(ttl) {
        if (ttl === undefined || ttl === null) return 'N/A';
        if (ttl === 0) return 'Respect Existing Headers';
        
        // Look up in settings config for proper label
        const setting = getSettingById('browser_cache_ttl');
        if (setting && setting.options) {
            const option = setting.options.find(opt => opt.value == ttl);
            if (option) return option.label;
        }
        
        // Fallback: Convert seconds to human-readable format
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
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = '← Previous';
        prevButton.className = 'pagination-btn';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayCurrentPage();
            }
        });
        paginationControls.appendChild(prevButton);
        
        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        paginationControls.appendChild(pageInfo);
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next →';
        nextButton.className = 'pagination-btn';
        nextButton.disabled = currentPage >= totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayCurrentPage();
            }
        });
        paginationControls.appendChild(nextButton);
        
        // Divider
        const divider = document.createElement('div');
        divider.className = 'pagination-divider';
        paginationControls.appendChild(divider);
        
        // Zones per page dropdown
        const perPageContainer = document.createElement('div');
        perPageContainer.className = 'per-page-container';
        
        const perPageLabel = document.createElement('label');
        perPageLabel.textContent = 'Per page:';
        perPageContainer.appendChild(perPageLabel);
        
        const perPageSelect = document.createElement('select');
        perPageSelect.className = 'per-page-select';
        [10, 20, 50, 100].forEach(count => {
            const option = document.createElement('option');
            option.value = count;
            option.textContent = count;
            option.selected = zonesPerPage === count;
            perPageSelect.appendChild(option);
        });
        perPageSelect.addEventListener('change', (e) => {
            zonesPerPage = parseInt(e.target.value);
            currentPage = 1; // Reset to first page
            updatePagination();
            displayCurrentPage();
        });
        perPageContainer.appendChild(perPageSelect);
        paginationControls.appendChild(perPageContainer);
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

    function updateZonesCount() {
        const startIndex = (currentPage - 1) * zonesPerPage + 1;
        const endIndex = Math.min(currentPage * zonesPerPage, allZones.length);
        
        if (allZones.length === 0) {
            zonesCountEl.textContent = 'No zones';
            return;
        }
        
        zonesCountEl.textContent = `Showing ${startIndex}-${endIndex} of ${allZones.length} zones`;
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

        // Show progress indicator
        showProgress();
        applySettingsBtn.disabled = true;
        
        // Get zone names for display
        const zoneIds = Array.from(selectedZones);
        const zoneMap = new Map();
        allZones.forEach(zone => {
            if (zoneIds.includes(zone.id)) {
                zoneMap.set(zone.id, zone.name);
            }
        });
        
        // Initialize progress
        updateProgress(0, zoneIds.length, 'Preparing to apply settings...');
        progressDetails.innerHTML = '';
        progressActions.style.display = 'none'; // Hide dismiss button initially
        
        // Log the settings being sent for debugging
        console.log('Applying settings:', settings);
        console.log('To zones:', zoneIds);
        
        try {
            const response = await fetch(`${apiBaseUrl}/zones/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    zone_ids: zoneIds,
                    settings: settings
                })
            });

            const data = await response.json();
            
            console.log('API response:', data);

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Update progress to 100%
            updateProgress(zoneIds.length, zoneIds.length, 'Processing complete!');
            
            // Display detailed results
            if (data.results && data.results.length > 0) {
                progressDetails.innerHTML = '';
                data.results.forEach(result => {
                    const zoneName = zoneMap.get(result.zoneId) || result.zoneId;
                    addProgressItem(zoneName, result.success, result.error);
                });
            }

            const successCount = data.updated_count || 0;
            const failCount = zoneIds.length - successCount;
            
            if (failCount === 0) {
                showSuccess(`✓ Successfully applied ${settingsCount} setting(s) to all ${successCount} zone(s)`);
            } else {
                showSuccess(`✓ Applied ${settingsCount} setting(s) to ${successCount} zone(s). ${failCount} failed.`);
            }
            
            // Clear form inputs after successful application
            resetSettingsForm();
            
            // Show dismiss button
            progressActions.style.display = 'flex';
            
            // Reload zones automatically if any updates were successful
            if (successCount > 0) {
                setTimeout(() => {
                    showLoading();
                    fetchAllZones();
                }, 1000); // Small delay to let user see the success message
            }
            
        } catch (error) {
            hideProgress();
            showError(`Failed to apply settings: ${error.message}`);
            console.error('Error applying settings:', error);
        } finally {
            applySettingsBtn.disabled = false;
        }
    }

    function showProgress() {
        progressIndicator.style.display = 'block';
        errorAlert.style.display = 'none';
        successAlert.style.display = 'none';
    }

    function hideProgress() {
        progressIndicator.style.display = 'none';
    }

    function updateProgress(current, total, message) {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        progressBar.style.width = `${percentage}%`;
        progressCount.textContent = `${current} / ${total}`;
        progressPercentage.textContent = `${percentage}%`;
        progressSummary.textContent = message;
    }

    function addProgressItem(zoneName, success, errorMsg) {
        const item = document.createElement('div');
        item.className = `progress-item ${success ? 'success' : 'error'}`;
        
        const icon = success ? '✓' : '✗';
        const status = success ? 'Updated' : `Failed: ${errorMsg || 'Unknown error'}`;
        
        item.innerHTML = `
            <span class="progress-item-icon">${icon}</span>
            <span class="progress-item-name">${zoneName}</span>
            <span class="progress-item-status">${status}</span>
        `;
        
        progressDetails.appendChild(item);
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
